const {
  ClientServiceBase, StatusCode,
} = require('..');
const {
  IllegalArgumentError,
} = require('../illegal_argument_error');
const sinon = require('sinon');
const assert = require('chai').assert;
const protobuf = {};
const services = {
  'ledgerPrivileged': {},
  'ledgerClient': {},
};
const clientProperties = {
  'scalar.ledger.client.private_key_pem': 'key',
  'scalar.ledger.client.cert_pem': 'cert',
  'scalar.ledger.client.cert_holder_id': 'hold',
  'scalar.ledger.client.cert_version': '1.0',
};

describe('Class ClientServiceBase', () => {
  describe('The constructor', () => {
    describe('should throw an error', () => {
      it('when the private key is missing', () => {
        const clientProperties = {
          // "scalar.ledger.client.private_key_pem": "key",
          'scalar.ledger.client.cert_pem': 'cert',
          'scalar.ledger.client.cert_holder_id': 'hold',
        };
        assert.throws(() => {
          new ClientServiceBase(services, protobuf, clientProperties);
        }, IllegalArgumentError, 'private_key_pem');
      });
      it('when the certificate is missing', () => {
        const clientProperties = {
          'scalar.ledger.client.private_key_pem': 'key',
          // 'scalar.ledger.client.cert_pem': 'cert',
          'scalar.ledger.client.cert_holder_id': 'hold',
        };
        assert.throws(() => {
          new ClientServiceBase(services, protobuf, clientProperties);
        }, IllegalArgumentError, 'cert_pem');
      });
      it('when holder id is missing', () => {
        const clientProperties = {
          'scalar.ledger.client.private_key_pem': 'key',
          'scalar.ledger.client.cert_pem': 'cert',
          // 'scalar.ledger.client.cert_holder_id': 'hold',
        };
        assert.throws(() => {
          new ClientServiceBase(services, protobuf, clientProperties);
        }, IllegalArgumentError, 'cert_holder_id');
      });
    });
    it('should properly load the attribute according to the given property',
        () => {
          const clientProperties = {
            'scalar.ledger.client.private_key_pem': 'key',
            'scalar.ledger.client.cert_pem': 'cert',
            'scalar.ledger.client.cert_holder_id': 'hold',
            'scalar.ledger.client.cert_version': '1.0',
            'scalar.ledger.client.authorization.credential':
                'mocked-credentials',
          };
          const clientService = new ClientServiceBase(services,
              protobuf, clientProperties);
          assert.equal(clientService.privateKeyPem, 'key');
          assert.equal(clientService.certPem, 'cert');
          assert.equal(clientService.certHolderId, 'hold');
          assert.equal(clientService.certVersion, '1.0');
          assert.equal(clientService.metadata.Authorization,
              'mocked-credentials');
        });
  });
  describe('The method', () => {
    afterEach(function() {
      sinon.restore();
    });

    // Mock for the signer library
    function genericEllipticSignatureSigner(service) {
      sinon.replace(service.signer, 'sign',
          sinon.fake.returns(function() {}));
      sinon.replace(service, 'sendRequest',
          sinon.fake.returns(function() {}));
    }

    describe('registerCertificate', () => {
      it('should work as expected', async () => {
        const mockedCertificateRegistrationRequest = {
          setCertHolderId: function() {},
          setCertVersion: function() {},
          setCertPem: function() {},
        };
        const mockedProtobuf = {
          CertificateRegistrationRequest: function() {
            return mockedCertificateRegistrationRequest;
          },
        };
        const clientServiceBase = new ClientServiceBase(
            services, mockedProtobuf, clientProperties);
        genericEllipticSignatureSigner(clientServiceBase);
        const mockSpySetCertHolderId = sinon.spy(
            mockedCertificateRegistrationRequest,
            'setCertHolderId');
        const mockSpySetCertVersion = sinon.spy(
            mockedCertificateRegistrationRequest,
            'setCertVersion');
        const mockSpySetCertPem = sinon.spy(
            mockedCertificateRegistrationRequest,
            'setCertPem');
        const request = await clientServiceBase.registerCertificate();

        assert(mockSpySetCertHolderId.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_holder_id']));
        assert(mockSpySetCertVersion.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_version']));
        assert(mockSpySetCertPem.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_pem']));
        assert.instanceOf(request, Function);
      });
    });

    describe('registerFunction', () => {
      it('should throw an error when contractBytes is not a Uint8Array',
          async () => {
            const clientServiceBase = new ClientServiceBase(services, protobuf,
                clientProperties);
            try {
              await clientServiceBase.registerFunction('contract1', 'foo',
                  'wrongType');
            } catch (e) {
              assert.instanceOf(e, IllegalArgumentError);
            }
          },
      );
      it('should work as expected', async () => {
        const mockedContractId = 12345;
        const mockedName = 'foo';
        const mockedByteCode = new Uint8Array([1, 2, 3]);
        const mockedFunctionRegistrationRequest = {
          setFunctionId: function() {},
          setFunctionBinaryName: function() {},
          setFunctionByteCode: function() {},
        };
        const mockedProtobuf = {
          FunctionRegistrationRequest: function() {
            return mockedFunctionRegistrationRequest;
          },
        };
        const clientServiceBase = new ClientServiceBase(services,
            mockedProtobuf,
            clientProperties);
        genericEllipticSignatureSigner(clientServiceBase);
        const mockSpyFunctionRegistrationRequest = sinon.spy(mockedProtobuf,
            'FunctionRegistrationRequest');
        const mockSpySetFunctionId = sinon.spy(
            mockedFunctionRegistrationRequest, 'setFunctionId');
        const mockSpySetFunctionBinaryName = sinon.spy(
            mockedFunctionRegistrationRequest, 'setFunctionBinaryName');
        const mockSpySetFunctionByteCode = sinon.spy(
            mockedFunctionRegistrationRequest, 'setFunctionByteCode');
        const request = await clientServiceBase.registerFunction(
            mockedContractId,
            mockedName, mockedByteCode, clientProperties);
        assert(mockSpyFunctionRegistrationRequest.calledOnce);
        assert(mockSpySetFunctionId.calledWithExactly(mockedContractId));
        assert(mockSpySetFunctionBinaryName.calledWithExactly(mockedName));
        assert(mockSpySetFunctionByteCode.calledWithExactly(mockedByteCode));
        assert.instanceOf(request, Function);
      });
    });

    describe('registerContract', () => {
      it('should throw an error when contractBytes is not a Uint8Array',
          async () => {
            const clientServiceBase = new ClientServiceBase(
                services, protobuf, clientProperties);
            try {
              await clientServiceBase.registerContract('contract1', 'foo',
                  'wrongType');
            } catch (e) {
              assert.instanceOf(e, IllegalArgumentError);
            }
          },
      );
      it('should work as expected', async () => {
        const mockedContractId = 12345;
        const mockedName = 'foo';
        const mockedByteCode = new Uint8Array([1, 2, 3]);
        const mockedPropertiesJson = JSON.stringify(clientProperties);
        const mockedContractRegistrationRequest = {
          setContractId: function() {},
          setContractBinaryName: function() {},
          setContractByteCode: function() {},
          setContractProperties: function() {},
          setCertHolderId: function() {},
          setCertVersion: function() {},
          setSignature: function() {},
        };
        const mockedProtobuf = {
          ContractRegistrationRequest: function() {
            return mockedContractRegistrationRequest;
          },
        };
        const clientServiceBase = new ClientServiceBase(services,
            mockedProtobuf, clientProperties);
        genericEllipticSignatureSigner(clientServiceBase);
        const mockSpyContractRegistrationRequest = sinon.spy(
            mockedProtobuf,
            'ContractRegistrationRequest');
        const mockSpySetContractBinaryName = sinon.spy(
            mockedContractRegistrationRequest,
            'setContractBinaryName');
        const mockSpySetContractId = sinon.spy(
            mockedContractRegistrationRequest,
            'setContractId');
        const mockSpySetContractByteCode = sinon.spy(
            mockedContractRegistrationRequest,
            'setContractByteCode');
        const mockSpySetContractProperties = sinon.spy(
            mockedContractRegistrationRequest,
            'setContractProperties');
        const mockSpySetCertHolderId = sinon.spy(
            mockedContractRegistrationRequest,
            'setCertHolderId');
        const mockSpySetCertVersion = sinon.spy(
            mockedContractRegistrationRequest,
            'setCertVersion');
        const mockSpySetSignature = sinon.spy(
            mockedContractRegistrationRequest,
            'setSignature');
        const request = await clientServiceBase.registerContract(
            mockedContractId,
            mockedName, mockedByteCode, clientProperties);
        assert(
            mockSpySetContractId.calledWithExactly(mockedContractId));
        assert(mockSpyContractRegistrationRequest.calledOnce);
        assert(mockSpySetContractBinaryName.calledWithExactly(
            mockedName));
        assert(mockSpySetContractByteCode.calledWithExactly(
            mockedByteCode));
        assert(mockSpySetContractProperties.calledWithExactly(
            mockedPropertiesJson));
        assert(mockSpySetCertHolderId.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_holder_id']));
        assert(mockSpySetCertVersion.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_version']));
        assert(mockSpySetSignature.calledOnce);
        assert.instanceOf(request, Function);
      });
    });
    describe('listContract', () => {
      it('should work as expected', async () => {
        const mockedContractId = 12345;
        const mockedListContracts = {
          setCertHolderId: function() {},
          setCertVersion: function() {},
          setContractId: function() {},
          setSignature: function() {},
        };
        const mockedProtobuf = {
          ContractsListingRequest: function() {
            return mockedListContracts;
          },
        };
        const clientServiceBase = new ClientServiceBase(services,
            mockedProtobuf,
            clientProperties);
        const mockSpyContractsListingRequest = sinon.spy(
            mockedProtobuf,
            'ContractsListingRequest');
        const mockSpySetCertHolderId = sinon.spy(mockedListContracts,
            'setCertHolderId');
        const mockSpySetCertVersion = sinon.spy(mockedListContracts,
            'setCertVersion');
        const mockSpySetContractId = sinon.spy(mockedListContracts,
            'setContractId');
        const mockSpySetSignature = sinon.spy(mockedListContracts,
            'setSignature');
        genericEllipticSignatureSigner(clientServiceBase);
        const request = await clientServiceBase.listContracts(mockedContractId);
        assert(mockSpyContractsListingRequest.calledOnce);
        assert(mockSpySetCertHolderId.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_holder_id']));
        assert(mockSpySetCertVersion.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_version']));
        assert(
            mockSpySetContractId.calledWithExactly(mockedContractId));
        assert(mockSpySetSignature.calledOnce);
        assert.instanceOf(request, Function);
      });
    });
    describe('validateLedger', () => {
      const mockedAssetId = 'contractId';
      it('should work as expected', async () => {
        const mockedValidateLedger = {
          setAssetId: function() {},
          setCertHolderId: function() {},
          setCertVersion: function() {},
          setSignature: function() {},
        };
        const mockedProtobuf = {
          LedgerValidationRequest: function() {
            return mockedValidateLedger;
          },
        };
        const clientServiceBase = new ClientServiceBase(services,
            mockedProtobuf,
            clientProperties);
        const mockSpyLedgerValidationRequest = sinon.spy(
            mockedProtobuf,
            'LedgerValidationRequest');
        const mockSpySetAssetId = sinon.spy(mockedValidateLedger,
            'setAssetId');
        const mockSpySetCertHolderId = sinon.spy(mockedValidateLedger,
            'setCertHolderId');
        const mockSpySetCertVersion = sinon.spy(mockedValidateLedger,
            'setCertVersion');
        const mockSpySetSignature = sinon.spy(mockedValidateLedger,
            'setSignature');
        genericEllipticSignatureSigner(clientServiceBase);
        const request = await clientServiceBase.validateLedger(mockedAssetId);
        assert(mockSpyLedgerValidationRequest.calledOnce);
        assert(mockSpySetAssetId.calledWithExactly(mockedAssetId));
        assert(mockSpySetCertHolderId.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_holder_id']));
        assert(mockSpySetCertVersion.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_version']));
        assert(mockSpySetSignature.calledOnce);
        assert.instanceOf(request, Function);
      });
    });
    describe('executeContract', () => {
      const mockedContractId = 12345;
      const mockedArgument = {'mocked': 'argument'};
      const mockedFunctionArgument = 'mockedFunctionArgument';
      const mockedFunctionArgumentJson = JSON.stringify(
          mockedFunctionArgument);
      it('should work as expected', async () => {
        const mockedExecuteContract = {
          setContractId: function() {},
          setContractArgument: function() {},
          setCertHolderId: function() {},
          setCertVersion: function() {},
          setFunctionArgument: function() {},
          setSignature: function() {},
        };
        const mockedProtobuf = {
          ContractExecutionRequest: function() {
            return mockedExecuteContract;
          },
        };
        const clientServiceBase = new ClientServiceBase(services,
            mockedProtobuf,
            clientProperties);
        const mockSpyContractExecutionRequest = sinon.spy(
            mockedProtobuf,
            'ContractExecutionRequest');
        const mockSpySetContractId = sinon.spy(mockedExecuteContract,
            'setContractId');
        const mockSpySetContractArgument = sinon.spy(
            mockedExecuteContract,
            'setContractArgument');
        const mockSpySetCertHolderId = sinon.spy(
            mockedExecuteContract,
            'setCertHolderId');
        const mockSpySetCertVersion = sinon.spy(mockedExecuteContract,
            'setCertVersion');
        const mockSpySetFunctionArgument = sinon.spy(
            mockedExecuteContract,
            'setFunctionArgument');
        const mockSpySetSignature = sinon.spy(mockedExecuteContract,
            'setSignature');
        genericEllipticSignatureSigner(clientServiceBase);
        const request = await clientServiceBase.executeContract(
            mockedContractId,
            mockedArgument, mockedFunctionArgument);
        assert(mockSpyContractExecutionRequest.calledOnce);
        assert(
            mockSpySetContractId.calledWithExactly(mockedContractId));
        assert(mockSpySetContractArgument.calledWith(
            sinon.match(mockedArgument.mocked)));
        assert(mockSpySetCertHolderId.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_holder_id']));
        assert(mockSpySetCertVersion.calledWithExactly(
            clientProperties['scalar.ledger.client.cert_version']));
        assert(mockSpySetSignature.calledOnce);
        assert(mockSpySetFunctionArgument.calledWithExactly(
            mockedFunctionArgumentJson));
        assert.instanceOf(request, Function);
      });
    });
    describe('sendRequest', () => {
      it('should reject on anonymous function name', async () => {
        const mockedErrorMessage = 'Mocked error message';
        const mock = {
          setMessage: function() {},
          setStatus: function() {},
        };
        const mockSpySetMessage = sinon.spy(mock, 'setMessage');
        const mockSpySetStatus = sinon.spy(mock, 'setStatus');
        const mockedProtobuf = {
          LedgerServiceResponse: function() {
            return mock;
          },
        };
        const mockSpyLedgerServiceResponse = sinon.spy(mockedProtobuf,
            'LedgerServiceResponse');
        const clientServiceBase = new ClientServiceBase(
            services, mockedProtobuf, clientProperties);
        await clientServiceBase.sendRequest('registerCert', () => {
          throw new Error(mockedErrorMessage);
        });
        assert(mockSpyLedgerServiceResponse.calledOnce);
        assert(
            mockSpySetMessage.calledWithExactly(mockedErrorMessage));
        assert(mockSpySetStatus.calledWithExactly(
            StatusCode.RUNTIME_ERROR));
      });
    });
  });
});
