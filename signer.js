const jsrsasign = require('jsrsasign');

/**
 * This class is used for signing certificates
 */
class SignatureSigner {
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
  sign(content) {
    const hex = jsrsasign.ArrayBuffertohex(content.buffer);
    const ecdsa = new jsrsasign.KJUR.crypto.ECDSA();
    try {
      const base64 = this.pem.replace('-----BEGIN EC PRIVATE KEY-----', '').
          replace('-----END EC PRIVATE KEY-----', '').
          replace(/\n/g, '');
      const toHex = jsrsasign.b64utohex(base64);
      ecdsa.readPKCS5PrvKeyHex(toHex);
    } catch (err) {
      throw new Error(`Failed to load private key ${err}`);
    }

    try {
      const signature = new jsrsasign.KJUR.crypto.Signature({
        'alg': 'SHA256withECDSA',
      });
      signature.init(ecdsa);
      signature.updateHex(hex);

      return new Uint8Array(jsrsasign.hextoArrayBuffer(signature.sign()));
    } catch (err) {
      throw new Error(`Failed to sign the request ${err}`);
    }
  }
}

module.exports = {
  SignatureSigner,
};
