import axios from 'axios';
import crypto from 'crypto';
import * as SibApiV3Sdk from '@sendinblue/client';
import { supabase } from '../config/supabase.js';
import {
    signPayload,
    PLEXO_CLIENT,
    PLEXO_COMMERCE_ID,
    PLEXO_CURRENCY_ID,
    PLEXO_LIMIT_BANKS,
    PLEXO_LIMIT_ISSUERS,
    PLEXO_REDIRECT_URI,
    PLEXO_API_URL,
    PLEXO_FINGERPRINT,
    getPrivateKey,
    canonicalize,
    patchDecimals,
} from '../utils/plexo.utils.js';

// ─── Helper: calcular precio final con descuento ─────────────────────────────
function calcularPrecioFinal(precio, discount, discount_value) {
    if (!discount || !discount_value) return precio;
    // discount_value es porcentaje (ej: 10 = 10%)
    return parseFloat((precio - (precio * discount_value) / 100).toFixed(2));
}

// ─── Helper: calcular TaxedAmount (base imponible sin IVA 22%) ───────────────
function calcularTaxedAmount(total) {
    return parseFloat((total / 1.22).toFixed(2));
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment — Inicia el ExpressCheckout con Plexo
// ─────────────────────────────────────────────────────────────────────────────
export const iniciarPago = async (req, res) => {
    try {
        const { datosPersonales, direccionEnvio, products, shop } = req.body;

        // Validación básica
        if (!datosPersonales?.email || !products?.length) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
        }

        // 1. Obtener productos desde Supabase para verificar precios
        const productIds = products.map((p) => p.id);
        const { data: productosDB, error: prodError } = await supabase
            .from('productos')
            .select('id, Producto, Precio, discount, discount_value')
            .in('id', productIds);

        if (prodError || !productosDB?.length) {
            return res.status(500).json({ success: false, message: 'Error al obtener productos.' });
        }

        // 2. Construir items y calcular total
        const items = products.map((p) => {
            const prod = productosDB.find((db) => db.id === p.id);
            if (!prod) throw new Error(`Producto ID ${p.id} no encontrado.`);
            const precioUnit = calcularPrecioFinal(prod.Precio, prod.discount, prod.discount_value);
            const totalItem  = parseFloat((precioUnit * p.quantity).toFixed(2));
            return {
                dbProd:    prod,
                quantity:  p.quantity,
                unitPrice: precioUnit,
                total:     totalItem,
                plexoItem: {
                    Amount:                parseFloat(totalItem),
                    ClientItemReferenceId: `Item-${prod.id}`,
                    Name:                  prod.Producto,
                    Quantity:              p.quantity,
                },
            };
        });

        const totalCompra    = parseFloat(items.reduce((sum, i) => sum + i.total, 0).toFixed(2));
        const taxedAmount    = calcularTaxedAmount(totalCompra);
        const nombreCompleto = `${direccionEnvio.nombre} ${direccionEnvio.apellido}`.trim();

        // 3. Insertar transacción en Supabase con estado 1 (pendiente)
        const { data: transaccion, error: tranError } = await supabase
            .from('transacciones')
            .insert([{
                email:          datosPersonales.email,
                nombre_completo: nombreCompleto,
                celular:         datosPersonales.telefono || '',
                direccion:       direccionEnvio.direccion || '',
                departamento:    direccionEnvio.ciudad    || '',
                codigo_postal:   direccionEnvio.codigoPostal || '',
                productos:       products.map((p) => ({ id: p.id, quantity: p.quantity })),
                total:           totalCompra,
                estado:          1,  // pendiente
                shop:            shop || 'husqvarna',
            }])
            .select()
            .single();

        if (tranError) {
            console.error('Error al insertar transacción:', tranError);
            return res.status(500).json({ success: false, message: 'Error al registrar la transacción.' });
        }

        const transaccionId = transaccion.id;

        // 4. Construir payload para Plexo
        const plexoPayload = {
            Client: PLEXO_CLIENT,
            Request: {
                AuthorizationData: {
                    Action:            64,
                    ClientInformation: {
                        Name:     direccionEnvio.nombre   || '',
                        LastName: direccionEnvio.apellido || '',
                        Address:  direccionEnvio.direccion || '',
                        Email:    datosPersonales.email,
                    },
                    DoNotUseCallback:  true,
                    LimitBanks:        PLEXO_LIMIT_BANKS,
                    LimitIssuers:      PLEXO_LIMIT_ISSUERS,
                    MetaReference:     datosPersonales.email,
                    OptionalCommerceId: PLEXO_COMMERCE_ID,
                    RedirectUri:       PLEXO_REDIRECT_URI,
                    Type:              0,
                },
                PaymentData: {
                    ClientReferenceId: String(transaccionId),
                    CurrencyId:        PLEXO_CURRENCY_ID,
                    FinancialInclusion: {
                        BilledAmount:  totalCompra,
                        InvoiceNumber: 9869,
                        TaxedAmount:   taxedAmount,
                        Type:          1,
                    },
                    Installments:      1,
                    Items:             items.map((i) => i.plexoItem),
                    OptionalCommerceId: PLEXO_COMMERCE_ID,
                    PaymentInstrumentInput: {
                        NonStorableItems: { CVC: '123' },
                        OptionalInstrumentFields: {
                            ShippingAddress:     direccionEnvio.direccion   || '',
                            ShippingZipCode:     direccionEnvio.codigoPostal || '',
                            ShippingCity:        direccionEnvio.ciudad       || '',
                            ShippingCountry:     'UY',
                            ShippingFirstName:   direccionEnvio.nombre       || '',
                            ShippingLastName:    direccionEnvio.apellido     || '',
                            ShippingPhoneNumber: datosPersonales.telefono    || '',
                        },
                        UseExtendedClientCreditIfAvailable: false,
                    },
                },
            },
        };

        // 5. Firmar y enviar a Plexo
        const signedBody = signPayload(plexoPayload);

        const plexoUrl = `${PLEXO_API_URL}/ExpressCheckout`;
        console.log('[Plexo] Enviando request a:', plexoUrl);

        const plexoRes = await axios.post(
            plexoUrl,
            signedBody,
            { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
        );

        console.log('[Plexo] Respuesta status:', plexoRes.status);
        console.log('[Plexo] Respuesta data:', JSON.stringify(plexoRes.data));

        const redirectUrl = plexoRes.data?.RedirectUrl || plexoRes.data?.Object?.RedirectUrl;
        if (!redirectUrl) {
            console.error('[Plexo] Respuesta sin RedirectUrl:', plexoRes.data);
            return res.status(502).json({ success: false, message: 'Respuesta inesperada de Plexo.' });
        }

        return res.status(200).json({
            success:      true,
            RedirectUrl:  redirectUrl,
            transaccionId,
        });

    } catch (error) {
        const errData = error?.response?.data;
        const errStatus = error?.response?.status;
        const errUrl = error?.config?.url;
        console.error(`[Plexo] ERROR ${errStatus} al llamar: ${errUrl}`);
        console.error('[Plexo] Respuesta:', JSON.stringify(errData));
        console.error('[Plexo] Mensaje:', error.message);
        return res.status(500).json({ success: false, message: 'Error interno al procesar el pago.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhook — Callback de Plexo (sin auth middleware)
// ─────────────────────────────────────────────────────────────────────────────
export const webhook = async (req, res) => {
    try {
        const body = req.body;

        // Plexo anida el objeto: body.Object.Object.Transactions.Purchase
        const purchase = body?.Object?.Object?.Transactions?.Purchase;

        if (!purchase) {
            console.warn('Webhook Plexo: estructura inesperada', JSON.stringify(body));
            return res.status(200).json({ received: true }); // Siempre responder 200 a Plexo
        }

        const { ClientReferenceId, Status } = purchase;
        const transaccionId = parseInt(ClientReferenceId, 10);

        if (isNaN(transaccionId)) {
            console.warn('Webhook Plexo: ClientReferenceId inválido:', ClientReferenceId);
            return res.status(200).json({ received: true });
        }

        // Status 0 = aprobado, cualquier otro = error
        const nuevoEstado = Status === 0 ? 0 : 1;

        const { error } = await supabase
            .from('transacciones')
            .update({ estado: nuevoEstado })
            .eq('id', transaccionId);

        if (error) {
            console.error('Error al actualizar estado en webhook:', error);
        } else {
            console.log(`Webhook: transacción ${transaccionId} → estado ${nuevoEstado}`);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('Error en webhook:', error.message);
        return res.status(200).json({ received: true }); // Siempre 200 para evitar reintentos de Plexo
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/verify-payment?transaccion_id=X — Consulta estado desde el FE
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
    try {
        const { transaccion_id } = req.query;

        if (!transaccion_id) {
            return res.status(400).json({ info: false, message: 'Se requiere transaccion_id.' });
        }

        const { data: tran, error } = await supabase
            .from('transacciones')
            .select('id, estado, email, nombre_completo, total, shop')
            .eq('id', transaccion_id)
            .single();

        if (error || !tran) {
            return res.status(404).json({ info: false, message: 'Transacción no encontrada.' });
        }

        return res.status(200).json({
            info:   true,
            status: tran.estado,  // 0 = aprobado, 1 = pendiente/error
            data:   tran,
        });

    } catch (error) {
        console.error('Error en verifyPayment:', error.message);
        return res.status(500).json({ info: false, message: 'Error interno del servidor.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/send-email?transaccion_id=X — Envío de emails de confirmación
// ─────────────────────────────────────────────────────────────────────────────
export const sendEmail = async (req, res) => {
    try {
        const { transaccion_id } = req.query;

        if (!transaccion_id) {
            return res.status(400).json({ success: false, message: 'Se requiere transaccion_id.' });
        }

        // 1. Obtener transacción
        const { data: tran, error: tranError } = await supabase
            .from('transacciones')
            .select('*')
            .eq('id', transaccion_id)
            .single();

        if (tranError || !tran) {
            return res.status(404).json({ success: false, message: 'Transacción no encontrada.' });
        }

        // 2. Obtener productos
        const productIds = tran.productos?.map((p) => p.id) || [];
        const { data: productosDB } = await supabase
            .from('productos')
            .select('id, Producto, Precio, discount, discount_value, Imagen')
            .in('id', productIds);

        // 3. Construir HTML del detalle de la compra
        const productosHtml = (productosDB || []).map((prod) => {
            const tranProd   = tran.productos.find((p) => p.id === prod.id);
            const qty        = tranProd?.quantity || 1;
            const precioUnit = calcularPrecioFinal(prod.Precio, prod.discount, prod.discount_value);
            const subtotal   = (precioUnit * qty).toFixed(2);
            return `
                <tr>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${prod.Producto}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${precioUnit.toFixed(2)}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${subtotal}</td>
                </tr>`;
        }).join('');

        const emailHtmlCliente = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <h2 style="color:#2d6a4f;">¡Gracias por tu compra, ${tran.nombre_completo}!</h2>
                <p>Tu pago fue <strong>aprobado</strong> exitosamente.</p>
                <h3>Detalle del pedido #${tran.id}</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f0f0f0;">
                            <th style="padding:8px;text-align:left;">Producto</th>
                            <th style="padding:8px;text-align:center;">Cant.</th>
                            <th style="padding:8px;text-align:right;">Precio unit.</th>
                            <th style="padding:8px;text-align:right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${productosHtml}</tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding:8px;text-align:right;font-weight:bold;">TOTAL:</td>
                            <td style="padding:8px;text-align:right;font-weight:bold;">$${tran.total}</td>
                        </tr>
                    </tfoot>
                </table>
                <h3>Datos de envío</h3>
                <p>
                    <strong>Nombre:</strong> ${tran.nombre_completo}<br>
                    <strong>Dirección:</strong> ${tran.direccion}<br>
                    <strong>Ciudad:</strong> ${tran.departamento}<br>
                    <strong>CP:</strong> ${tran.codigo_postal}<br>
                    <strong>Teléfono:</strong> ${tran.celular}
                </p>
                <p style="color:#666;font-size:12px;">
                    Ante cualquier consulta escribinos a <a href="mailto:husqvarnapremiumstore@agrojardinmaldonado.com">husqvarnapremiumstore@agrojardinmaldonado.com</a>
                </p>
            </div>`;

        const emailHtmlInterno = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <h2>Nuevo pedido #${tran.id} — $${tran.total}</h2>
                <p><strong>Tienda:</strong> ${tran.shop || 'husqvarna'}</p>
                <p><strong>Cliente:</strong> ${tran.nombre_completo} | ${tran.email} | ${tran.celular}</p>
                <p><strong>Dirección:</strong> ${tran.direccion}, ${tran.departamento} (CP ${tran.codigo_postal})</p>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f0f0f0;">
                            <th style="padding:8px;text-align:left;">Producto</th>
                            <th style="padding:8px;text-align:center;">Cant.</th>
                            <th style="padding:8px;text-align:right;">Precio unit.</th>
                            <th style="padding:8px;text-align:right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${productosHtml}</tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding:8px;text-align:right;font-weight:bold;">TOTAL:</td>
                            <td style="padding:8px;text-align:right;font-weight:bold;">$${tran.total}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>`;

        // 4. Enviar emails via Brevo (Sendinblue)
        const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
        brevoClient.setApiKey(
            SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
            process.env.BREVO_API_KEY
        );

        const fromSender = { name: 'AgroJardin', email: 'husqvarnapremiumstore@agrojardinmaldonado.com' };

        // Email al cliente
        await brevoClient.sendTransacEmail({
            sender:   fromSender,
            to:       [{ email: tran.email, name: tran.nombre_completo }],
            subject:  `¡Tu compra fue confirmada! Pedido #${tran.id}`,
            htmlContent: emailHtmlCliente,
        });

        // Email interno
        await brevoClient.sendTransacEmail({
            sender:   fromSender,
            to:       [{ email: 'husqvarnapremiumstore@agrojardinmaldonado.com', name: 'AgroJardin Admin' }],
            subject:  `[NUEVO PEDIDO] #${tran.id} — ${tran.nombre_completo} — $${tran.total}`,
            htmlContent: emailHtmlInterno,
        });

        return res.status(200).json({ success: true, message: 'Emails enviados correctamente.' });

    } catch (error) {
        console.error('Error en sendEmail:', error.message);
        return res.status(500).json({ success: false, message: 'Error al enviar emails.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/update-tran — Actualización manual del estado de una transacción
// ─────────────────────────────────────────────────────────────────────────────
export const updateTransaction = async (req, res) => {
    try {
        const { transaccion_id, estado } = req.body;

        if (transaccion_id === undefined || estado === undefined) {
            return res.status(400).json({ success: false, message: 'Se requieren transaccion_id y estado.' });
        }

        if (![0, 1].includes(Number(estado))) {
            return res.status(400).json({ success: false, message: 'Estado inválido. Valores permitidos: 0 (aprobado), 1 (pendiente/error).' });
        }

        const { data, error } = await supabase
            .from('transacciones')
            .update({ estado: Number(estado) })
            .eq('id', transaccion_id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ success: false, message: 'Error al actualizar la transacción.', error: error.message });
        }

        return res.status(200).json({ success: true, message: 'Transacción actualizada.', data });

    } catch (error) {
        console.error('Error en updateTransaction:', error.message);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/check-transaction — Consulta estado directamente en Plexo
// ─────────────────────────────────────────────────────────────────────────────
export const consultarEstadoPlexo = async (req, res) => {
    try {
        const { transaccion_id } = req.body;

        if (!transaccion_id) {
            return res.status(400).json({ success: false, message: 'Se requiere transaccion_id.' });
        }

        const queryPayload = {
            Client: PLEXO_CLIENT,
            Request: {
                ClientReferenceId: String(transaccion_id),
                OptionalCommerceId: PLEXO_COMMERCE_ID,
            },
        };

        const signedBody = signPayload(queryPayload);

        const plexoRes = await axios.post(
            `${PLEXO_API_URL}/Operation/Status`,
            signedBody,
            { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
        );

        return res.status(200).json({ success: true, data: plexoRes.data });

    } catch (error) {
        console.error('Error en consultarEstadoPlexo:', error?.response?.data || error.message);
        return res.status(500).json({ success: false, message: 'Error al consultar el estado en Plexo.' });
    }
};
