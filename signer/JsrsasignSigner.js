const jsrsasign = require('jsrsasign');

/**
 * This class is used for signing certificates using jsrsasign library
 */
class JsrsasignSigner {
  /**
   * @param {string} pem
   */
  constructor(pem) {
    this.pem = pem;
  }

  /**
   * This method is used for signing the content
   * @param {Uint8Array} content
   * @return {Uint8Array}
   */
  async sign(content) {
    const hex = jsrsasign.ArrayBuffertohex(content.buffer);
    const ecdsa = new jsrsasign.KJUR.crypto.ECDSA();
    try {
      const base64 = this.pem.replace('-----BEGIN EC PRIVATE KEY-----', '').
          replace('-----END EC PRIVATE KEY-----', '').
          replace(/\n/g, '');
      ecdsa.readPKCS5PrvKeyHex(jsrsasign.b64utohex(base64));
    } catch (err) {
      throw new Error(`Failed to load private key`);
    }

    try {
      const signature = new jsrsasign.KJUR.crypto.Signature({
        'alg': 'SHA256withECDSA',
      });
      signature.init(ecdsa);
      signature.updateHex(hex);

      return new Uint8Array(jsrsasign.hextoArrayBuffer(signature.sign()));
    } catch (err) {
      throw new Error(`Failed to sign the request`);
    }
  }
}

module.exports = {
  JsrsasignSigner,
};
