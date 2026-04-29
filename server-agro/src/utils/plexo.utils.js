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
export const PLEXO_CLIENT         = 'agrojardin';
export const PLEXO_COMMERCE_ID    = 45274;
export const PLEXO_CURRENCY_ID    = 2;      // UYU
export const PLEXO_LIMIT_BANKS    = ['113', '137']; // BROU, Itaú
export const PLEXO_LIMIT_ISSUERS  = ['4', '11'];    // Visa, OCA
export const PLEXO_REDIRECT_URI   = 'https://www.agrojardinmaldonado.com/Verify';
export const PLEXO_API_URL        = 'https://api.plexo.com.uy';

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

// ─── Parche de decimales (Plexo requiere floats en montos) ───────────────────
export function patchDecimals(jsonStr) {
    return jsonStr
        .replace(/"BilledAmount":(\d+)(?!\.\d)/g, '"BilledAmount":$1.0')
        .replace(/"TaxedAmount":(\d+)(?!\.\d)/g,  '"TaxedAmount":$1.0')
        .replace(/"Amount":(\d+)(?!\.\d)/g,        '"Amount":$1.0');
}

// ─── Firma SHA512 + RSA PKCS1 ─────────────────────────────────────────────────
export function signPayload(payloadObj) {
    const privateKey = getPrivateKey();

    // 1. Canonicalizar el objeto
    const canonicalized = canonicalize(payloadObj);

    // 2. Construir el objeto a firmar
    const expirationMs = Date.now() + 5 * 60 * 1000; // 5 minutos
    const toSign = {
        Fingerprint: PLEXO_FINGERPRINT,
        Object: canonicalized,
        UTCUnixTimeExpiration: expirationMs,
    };

    // 3. Serializar a JSON compacto
    let jsonStr = JSON.stringify(toSign);

    // 4. Parche de decimales
    jsonStr = patchDecimals(jsonStr);

    // 5. Firmar con SHA512 + RSA
    const sign = crypto.createSign('SHA512');
    sign.update(jsonStr, 'utf8');
    const signature = sign.sign(privateKey, 'base64');

    return {
        Object: canonicalized,
        Signature: signature,
    };
}
