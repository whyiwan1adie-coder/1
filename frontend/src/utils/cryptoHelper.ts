// utils/cryptoHelper.ts
export const CryptoHelper = {
    async createNewKeys() {
        const keys = await window.crypto.subtle.generateKey(
            { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
            true, ["encrypt", "decrypt"]
        );
        const pub = await window.crypto.subtle.exportKey("spki", keys.publicKey);
        const priv = await window.crypto.subtle.exportKey("jwk", keys.privateKey);
        return {
            publicKeyPem: btoa(String.fromCharCode(...new Uint8Array(pub))),
            privateKeyJwk: JSON.stringify(priv),
            rawPriv: keys.privateKey
        };
    },

    async importPrivateKey(jwkString: string) {
        return await window.crypto.subtle.importKey("jwk", JSON.parse(jwkString), { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
    },

    // Шифруем приватный ключ паролем пользователя
    async encryptPrivateKey(privateKeyJwk: string, password: string): Promise<string> {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
        );
        const aesKey = await window.crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: enc.encode("hush_salt"), iterations: 100000, hash: "SHA-256" },
            keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
        );
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv }, aesKey, enc.encode(privateKeyJwk)
        );
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        return btoa(String.fromCharCode(...combined));
    },

    // Расшифровываем приватный ключ паролем
    async decryptPrivateKey(encryptedBase64: string, password: string): Promise<string | null> {
        try {
            const enc = new TextEncoder();
            const combined = new Uint8Array(atob(encryptedBase64).split("").map(c => c.charCodeAt(0)));
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            const keyMaterial = await window.crypto.subtle.importKey(
                "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
            );
            const aesKey = await window.crypto.subtle.deriveKey(
                { name: "PBKDF2", salt: enc.encode("hush_salt"), iterations: 100000, hash: "SHA-256" },
                keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
            );
            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv }, aesKey, data
            );
            return new TextDecoder().decode(decrypted);
        } catch {
            return null;
        }
    },

    async encryptHybrid(text: string, publicKeyPem: string) {
        const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedContent = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(text));
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const binaryDer = new Uint8Array(atob(publicKeyPem).split("").map(c => c.charCodeAt(0)));
        const pubKeyObj = await window.crypto.subtle.importKey("spki", binaryDer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
        const encryptedAesKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKeyObj, exportedAesKey);

        return JSON.stringify({
            k: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey))),
            i: btoa(String.fromCharCode(...new Uint8Array(iv))),
            d: btoa(String.fromCharCode(...new Uint8Array(encryptedContent)))
        });
    },

    async decryptHybrid(packetStr: string, privateKey: CryptoKey) {
        try {
            const p = JSON.parse(packetStr);
            const aesKeyRaw = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, new Uint8Array(atob(p.k).split("").map(c => c.charCodeAt(0))));
            const aesKey = await window.crypto.subtle.importKey("raw", aesKeyRaw, "AES-GCM", true, ["decrypt"]);
            const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(atob(p.i).split("").map(c => c.charCodeAt(0))) }, aesKey, new Uint8Array(atob(p.d).split("").map(c => c.charCodeAt(0))));
            return new TextDecoder().decode(decrypted);
        } catch { return "[DECRYPTION_ERROR]"; }
    },

    async encryptLargeData(base64Data: string, publicKeyPem: string) {
        const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const binaryStr = atob(base64Data.split(',')[1] || base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) { bytes[i] = binaryStr.charCodeAt(i); }

        const encryptedContent = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, bytes);
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const binaryDer = new Uint8Array(atob(publicKeyPem).split("").map(c => c.charCodeAt(0)));
        const pubKeyObj = await window.crypto.subtle.importKey("spki", binaryDer.buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
        const encryptedAesKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKeyObj, exportedAesKey);

        return JSON.stringify({
            t: 'img',
            k: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey))),
            i: btoa(String.fromCharCode(...new Uint8Array(iv))),
            d: btoa(String.fromCharCode(...new Uint8Array(encryptedContent)))
        });
    },

    async decryptLargeData(packetStr: string, privateKey: CryptoKey): Promise<string | null> {
        try {
            const p = JSON.parse(packetStr);
            if (p.t !== 'img') return null;
            const aesKeyRaw = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, new Uint8Array(atob(p.k).split("").map(c => c.charCodeAt(0))));
            const aesKey = await window.crypto.subtle.importKey("raw", aesKeyRaw, "AES-GCM", true, ["decrypt"]);
            const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(atob(p.i).split("").map(c => c.charCodeAt(0))) }, aesKey, new Uint8Array(atob(p.d).split("").map(c => c.charCodeAt(0))));
            const bytes = new Uint8Array(decrypted);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) { binary += String.fromCharCode(bytes[i]); }
            return 'data:image/png;base64,' + btoa(binary);
        } catch { return null; }
    }
};