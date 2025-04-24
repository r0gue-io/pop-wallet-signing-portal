import { BigNumberish, ethers, keccak256 } from 'ethers';
import { UnsafeApi, AccountId } from "polkadot-api"
import { fromHex } from "polkadot-api/utils";

/**
 * Calculates the expected Ethereum-style contract address using CREATE or CREATE2 logic.
 */
export async function calculateContractAddress(
    api: UnsafeApi<any>,
    accountId: string,
    code: string, 
    data: Uint8Array,
    salt: string,
  ): Promise<string | undefined> {
    let calculatedAddress: string | undefined = undefined;
    const accountIdEncoded = AccountId()[0];
    const mappedAccount = toEthAddress(accountIdEncoded(accountId));
    if (salt) {
        // Use CREATE2
        calculatedAddress = create2(mappedAccount, fromHex(code), data, salt);
    } else {
        // @ts-ignore
        const nonce = await api.apis.AccountNonceApi.account_nonce(accountId);
         // Use CREATE1
        if (nonce !== null) {
            calculatedAddress = create1(mappedAccount, nonce);
        }
    }
    return calculatedAddress;
}

/**
 * TypeScript equivalent of H160 (20-byte Ethereum address)
 */
type Address = string;

/**
 * Determine the address of a contract using CREATE semantics.
 * @param deployer The address of the deployer
 * @param nonce The nonce value
 * @returns The contract address
 */
function create1(deployer: string, nonce: number): Address {
  // Convert deployer to bytes (remove 0x prefix if present)
  const deployerBytes = ethers.hexlify(deployer);
  ethers.toBeHex(nonce as BigNumberish);
  // Convert nonce to hex (minimal encoding)
  const nonceBytes = ethers.toBeHex(nonce as BigNumberish);

  // RLP encode [deployer, nonce]
  const encodedData = ethers.encodeRlp([deployerBytes, nonceBytes]);

  // Calculate keccak256 hash of the RLP encoded data
  const hash = ethers.keccak256(encodedData);

  // Take the last 20 bytes (40 hex chars + 0x prefix)
  return ethers.getAddress('0x' + hash.substring(26));
}

function create2(
  deployer: string,
  code: Uint8Array,
  inputData: Uint8Array,
  salt: string,
): string {
  const initCode = new Uint8Array([...code, ...inputData]);
  const initCodeHash = fromHex(keccak256(initCode));

  const parts = new Uint8Array(1 + 20 + 32 + 32); // 0xff + deployer + salt + initCodeHash
  parts[0] = 0xff;
  parts.set(fromHex(deployer), 1);
  parts.set(fromHex(salt), 21);
  parts.set(initCodeHash, 53);

  const hash = keccak256(parts);

  // Return last 20 bytes as 0x-prefixed hex string
  return ethers.getAddress('0x' + hash.substring(26));
}

/**
 * Determines if an account ID is derived from an Ethereum address
 * @param accountId The account ID bytes
 * @returns True if the account is derived from an Ethereum address
 */
export function isEthDerived(accountId: Uint8Array): boolean {
    if (accountId.length >= 32) {
      return accountId[20] === 0xee && accountId[21] === 0xee;
    }
    return false;
  }

/**
 * Converts an account ID to an Ethereum address (H160)
 * @param accountId The account ID bytes
 * @returns The Ethereum address
 */
export function toEthAddress(accountBytes: Uint8Array): string {
  
    // Create a 32-byte buffer and copy account bytes into it
    const accountBuffer = new Uint8Array(32);
    accountBuffer.set(accountBytes.slice(0, 32));
  
    if (isEthDerived(accountBytes)) {
      // This was originally an eth address
      // We just strip the 0xEE suffix to get the original address
      return '0x' + Buffer.from(accountBuffer.slice(0, 20)).toString('hex');
    } else {
      // This is an (ed|sr)25519 derived address
      // Avoid truncating the public key by hashing it first
      const accountHash = ethers.keccak256(accountBuffer);
      return ethers.getAddress('0x' + accountHash.slice(2 + 24, 2 + 24 + 40)); // Skip '0x' prefix, then skip 12 bytes, take 20 bytes
    }
  }