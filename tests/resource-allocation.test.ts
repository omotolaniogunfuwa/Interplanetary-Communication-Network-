import { describe, it, beforeEach, expect } from "vitest"

describe("Resource Allocation Contract", () => {
  let mockStorage: Map<string, any>
  let currentBlockHeight: number
  const CONTRACT_OWNER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  
  beforeEach(() => {
    mockStorage = new Map()
    currentBlockHeight = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "allocate-resources":
        if (sender !== CONTRACT_OWNER) return { success: false, error: 403 }
        const [nodeId, bandwidth, power] = args
        mockStorage.set(`resources-${nodeId}`, {
          bandwidth,
          power,
          last_updated: currentBlockHeight,
        })
        return { success: true }
      
      case "update-resource-usage":
        const [updateNodeId, bandwidthUsed, powerUsed] = args
        const resources = mockStorage.get(`resources-${updateNodeId}`)
        if (!resources) return { success: false, error: 404 }
        resources.bandwidth -= bandwidthUsed
        resources.power -= powerUsed
        resources.last_updated = currentBlockHeight
        return { success: true }
      
      case "get-node-resources":
        return { success: true, value: mockStorage.get(`resources-${args[0]}`) }
      
      case "is-resource-available":
        const [checkNodeId, requiredBandwidth, requiredPower] = args
        const checkResources = mockStorage.get(`resources-${checkNodeId}`)
        if (!checkResources) return { success: true, value: false }
        return {
          success: true,
          value: checkResources.bandwidth >= requiredBandwidth && checkResources.power >= requiredPower,
        }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should allocate resources to a node", () => {
    const result = mockContractCall("allocate-resources", [1, 1000, 500], CONTRACT_OWNER)
    expect(result.success).toBe(true)
  })
  
  it("should not allow non-owners to allocate resources", () => {
    const result = mockContractCall("allocate-resources", [1, 1000, 500], "user1")
    expect(result.success).toBe(false)
    expect(result.error).toBe(403)
  })
  
  it("should update resource usage", () => {
    mockContractCall("allocate-resources", [1, 1000, 500], CONTRACT_OWNER)
    const result = mockContractCall("update-resource-usage", [1, 200, 100], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should get node resources", () => {
    mockContractCall("allocate-resources", [1, 1000, 500], CONTRACT_OWNER)
    const result = mockContractCall("get-node-resources", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      bandwidth: 1000,
      power: 500,
      last_updated: 0,
    })
  })
  
  it("should check if resources are available", () => {
    mockContractCall("allocate-resources", [1, 1000, 500], CONTRACT_OWNER)
    const result = mockContractCall("is-resource-available", [1, 800, 400], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
  })
  
  it("should return false if resources are not available", () => {
    mockContractCall("allocate-resources", [1, 1000, 500], CONTRACT_OWNER)
    const result = mockContractCall("is-resource-available", [1, 1200, 600], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(false)
  })
})

