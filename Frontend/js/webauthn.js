// WebAuthn Helper Functions for Fingerprint Authentication

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Check if WebAuthn is supported
function isWebAuthnSupported() {
    return window.PublicKeyCredential !== undefined &&
        navigator.credentials !== undefined;
}

// Register fingerprint (during signup)
async function registerFingerprint(userEmail) {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported on this device/browser');
    }

    try {
        // Create credential options
        const publicKeyCredentialCreationOptions = {
            challenge: Uint8Array.from(
                userEmail + Date.now(),
                c => c.charCodeAt(0)
            ),
            rp: {
                name: "Risk-Based Auth System",
                id: window.location.hostname
            },
            user: {
                id: Uint8Array.from(userEmail, c => c.charCodeAt(0)),
                name: userEmail,
                displayName: userEmail
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" },  // ES256
                { alg: -257, type: "public-key" } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform", // Use platform authenticator (Touch ID, Windows Hello)
                userVerification: "required"
            },
            timeout: 60000,
            attestation: "direct"
        };

        // Create credential
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });

        // Convert credential to storable format
        const credentialData = {
            id: credential.id,
            rawId: arrayBufferToBase64(credential.rawId),
            type: credential.type,
            response: {
                attestationObject: arrayBufferToBase64(credential.response.attestationObject),
                clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
            }
        };

        return credentialData;
    } catch (error) {
        console.error('Fingerprint registration error:', error);
        throw error;
    }
}

// Verify fingerprint (during login MFA)
async function verifyFingerprint(userEmail, storedCredentialId) {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported on this device/browser');
    }

    try {
        // Create assertion options
        const publicKeyCredentialRequestOptions = {
            challenge: Uint8Array.from(
                userEmail + Date.now(),
                c => c.charCodeAt(0)
            ),
            allowCredentials: [{
                id: base64ToArrayBuffer(storedCredentialId),
                type: 'public-key',
                transports: ['internal']
            }],
            timeout: 60000,
            userVerification: "required"
        };

        // Get assertion
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });

        // Convert assertion to verifiable format
        const assertionData = {
            id: assertion.id,
            rawId: arrayBufferToBase64(assertion.rawId),
            type: assertion.type,
            response: {
                authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
                clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
                signature: arrayBufferToBase64(assertion.response.signature),
                userHandle: assertion.response.userHandle ?
                    arrayBufferToBase64(assertion.response.userHandle) : null
            }
        };

        return assertionData;
    } catch (error) {
        console.error('Fingerprint verification error:', error);
        throw error;
    }
}

// Show user-friendly error messages
function getFingerprintErrorMessage(error) {
    if (error.name === 'NotSupportedError') {
        return 'Fingerprint authentication is not supported on this device or browser.';
    } else if (error.name === 'NotAllowedError') {
        return 'Fingerprint authentication was cancelled or timed out.';
    } else if (error.name === 'InvalidStateError') {
        return 'This fingerprint is already registered.';
    } else if (error.name === 'SecurityError') {
        return 'Security error. Please ensure you are using HTTPS or localhost.';
    } else {
        return 'Fingerprint authentication failed: ' + error.message;
    }
}
