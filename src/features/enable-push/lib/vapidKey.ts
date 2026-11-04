/** A VAPID public key (URL-safe base64, unpadded) as the bytes `pushManager.subscribe` wants. */
export function vapidKeyBytes(key: string): Uint8Array<ArrayBuffer> {
	const base64 = key.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
	const raw = atob(padded);
	const bytes = new Uint8Array(new ArrayBuffer(raw.length));
	for (let i = 0; i < raw.length; i++) {
		bytes[i] = raw.charCodeAt(i);
	}
	return bytes;
}
