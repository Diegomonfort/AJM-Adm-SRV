import forge from 'node-forge';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Configuración del certificado ───────────────────────────────────────────
const PFX_PATH = path.join(__dirname, '../../certs/agrojardin.pfx');
const PFX_PASSWORD = 'hGGLJOxE1LDpLGQa15';

// Fingerprint SHA1 del certificado público de Plexo (NO cambiar)
export const PLEXO_FINGERPRINT = '41749F756FAC1A308FFF1407CB600B77DE978C0D';

// ─── Valores fijos del comercio ───────────────────────────────────────────────
export const PLEXO_CLIENT        = 'agrojardin';
export const PLEXO_COMMERCE_ID   = 45274;
export const PLEXO_CURRENCY_ID   = 2;       // UYU
export const PLEXO_LIMIT_BANKS   = ['113', '137']; // BROU, Itaú
export const PLEXO_LIMIT_ISSUERS = ['4', '11'];    // Visa, OCA
export const PLEXO_REDIRECT_URI  = 'https://www.agrojardinmaldonado.com/Verify';

// URL correcta de producción con puerto (igual al backend original)
export const PLEXO_API_URL = 'https://pagos.plexo.com.uy:4043/SecurePaymentGateway.svc';

// ─── Carga de clave privada ───────────────────────────────────────────────────
let _privateKey = null;

export function getPrivateKey() {
    if (_privateKey) return _privateKey;

    const pfxBuffer = fs.readFileSync(PFX_PATH);
    const pfxB64 = pfxBuffer.toString('binary');
    const p12Asn1 = forge.asn1.fromDer(pfxB64);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, PFX_PASSWORD);

    const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];

    _privateKey = forge.pki.privateKeyToPem(keyBag.key);
    return _privateKey;
}

// ─── Canonicalización (ordenamiento recursivo de keys) ────────────────────────
export function canonicalize(obj) {
    if (Array.isArray(obj)) {
        return obj.map(canonicalize);
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj)
            .sort()
            .reduce((acc, key) => {
                acc[key] = canonicalize(obj[key]);
                return acc;
            }, {});
    }
    return obj;
}

// ─── Parche de decimales (idéntico al backend original) ───────────────────────
// Captura el carácter siguiente (coma o llave de cierre) para no romper el JSON
export function patchDecimals(jsonStr) {
    return jsonStr
        .replace(/"BilledAmount":(\d+)(,|})/g, '"BilledAmount":$1.0$2')
        .replace(/"TaxedAmount":(\d+)(,|})/g,  '"TaxedAmount":$1.0$2')
        .replace(/"Amount":(\d+)(,|})/g,        '"Amount":$1.0$2');
}

// ─── Firma SHA512 + RSA PKCS1 ─────────────────────────────────────────────────
// El payload final enviado a Plexo es:
//   { "Object": { Fingerprint, Object: innerObj, UTCUnixTimeExpiration }, "Signature": "..." }
//
// Esto es idéntico a lo que hace el backend original con:
//   const finalPayloadJson = `{"Object":${jsonString},"Signature":"${signature}"}`;
export function signPayload(innerObject) {
    const privateKey = getPrivateKey();

    const expirationTime = Date.now() + 60 * 60 * 1000; // 1 hora (igual al original)

    // El objeto que se firma Y que va dentro del campo "Object" del body final
    const payloadToSign = {
        Fingerprint: PLEXO_FINGERPRINT,
        Object: canonicalize(innerObject),
        UTCUnixTimeExpiration: expirationTime,
    };

    // Serializar a JSON compacto sin espacios (igual al original)
    let jsonString = JSON.stringify(payloadToSign, null, 0).replace(/\s+/g, '');

    // Parche de decimales
    jsonString = patchDecimals(jsonString);

    // Firmar con SHA512 + RSA PKCS1 explícito (igual al original)
    const sign = crypto.createSign('SHA512');
    sign.update(jsonString);
    const signature = sign.sign(
        { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
        'base64'
    );

    // Construir el JSON final igual que el original:
    // {"Object": {Fingerprint, Object: innerObj, UTCUnixTimeExpiration}, "Signature": "..."}
    return JSON.parse(`{"Object":${jsonString},"Signature":"${signature}"}`);
}
