import { describe, it, beforeEach, expect } from "vitest"

describe("Encryption Contract", () => {
  let mockStorage: Map<string, any>
  let nextKeyId: number
  let currentBlockHeight: number
  
  beforeEach(() => {
    mockStorage = new Map()
    nextKeyId = 0
    currentBlockHeight = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "register-public-key":
        const [publicKey, algorithm, expiration] = args
        nextKeyId++
        mockStorage.set(`key-${nextKeyId}`, {
          owner: sender,
          public_key: publicKey,
          algorithm,
          expiration,
        })
        return { success: true, value: nextKeyId }
      
      case "update-key-expiration":
        const [keyId, newExpiration] = args
        const key = mockStorage.get(`key-${keyId}`)
        if (!key) return { success: false, error: 404 }
        if (key.owner !== sender) return { success: false, error: 403 }
        key.expiration = newExpiration
        return { success: true }
      
      case "get-public-key":
        return { success: true, value: mockStorage.get(`key-${args[0]}`) }
      
      case "is-key-valid":
        const validKey = mockStorage.get(`key-${args[0]}`)
        if (!validKey) return { success: true, value: false }
        return { success: true, value: currentBlockHeight < validKey.expiration }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should register a new public key", () => {
    const result = mockContractCall("register-public-key", ["0x1234", "quantum-resistant-algo", 1000], "user1")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should update key expiration", () => {
    mockContractCall("register-public-key", ["0x1234", "quantum-resistant-algo", 1000], "user1")
    const result = mockContractCall("update-key-expiration", [1, 2000], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should get public key information", () => {
    mockContractCall("register-public-key", ["0x1234", "quantum-resistant-algo", 1000], "user1")
    const result = mockContractCall("get-public-key", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      owner: "user1",
      public_key: "0x1234",
      algorithm: "quantum-resistant-algo",
      expiration: 1000,
    })
  })
  
  it("should check if a key is valid", () => {
    mockContractCall("register-public-key", ["0x1234", "quantum-resistant-algo", 1000], "user1")
    currentBlockHeight = 500
    const result = mockContractCall("is-key-valid", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
  })
  
  it("should return false for an expired key", () => {
    mockContractCall("register-public-key", ["0x1234", "quantum-resistant-algo", 1000], "user1")
    currentBlockHeight = 1500
    const result = mockContractCall("is-key-valid", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(false)
  })
})
