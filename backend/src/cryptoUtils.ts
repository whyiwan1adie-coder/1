// Вспомогательные функции для работы с ключами
export async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportKey(key: CryptoKey) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(pem: string) {
    const binaryDerString = window.atob(pem);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }
    return await window.crypto.subtle.importKey(
        "spki",
        binaryDer.buffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );
}

export async function encryptMessage(text: string, publicKeyPem: string) {
    const publicKey = await importPublicKey(publicKeyPem);
    const encoded = new TextEncoder().encode(text);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        encoded
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Приватный ключ мы будем хранить в памяти/IndexedDB, 
// но для простоты этого этапа покажем логику работы с ним
export async function decryptMessage(encryptedBase64: string, privateKey: CryptoKey) {
    try {
        const encrypted = new Uint8Array(atob(encryptedBase64).split("").map(c => c.charCodeAt(0)));
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encrypted
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        return "[Ошибка расшифровки: возможно, сообщение не для вас]";
    }
}