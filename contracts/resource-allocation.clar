;; Resource Allocation Contract

(define-map node-resources
  { node-id: uint }
  {
    bandwidth: uint,
    power: uint,
    last-updated: uint
  }
)

(define-constant CONTRACT_OWNER tx-sender)

(define-public (allocate-resources (node-id uint) (bandwidth uint) (power uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err u403))
    (ok (map-set node-resources
      { node-id: node-id }
      {
        bandwidth: bandwidth,
        power: power,
        last-updated: block-height
      }
    ))
  )
)

(define-public (update-resource-usage (node-id uint) (bandwidth-used uint) (power-used uint))
  (let
    ((resources (unwrap! (map-get? node-resources { node-id: node-id }) (err u404))))
    (ok (map-set node-resources
      { node-id: node-id }
      {
        bandwidth: (- (get bandwidth resources) bandwidth-used),
        power: (- (get power resources) power-used),
        last-updated: block-height
      }
    ))
  )
)

(define-read-only (get-node-resources (node-id uint))
  (map-get? node-resources { node-id: node-id })
)

(define-read-only (is-resource-available (node-id uint) (required-bandwidth uint) (required-power uint))
  (match (map-get? node-resources { node-id: node-id })
    resources (and
                (>= (get bandwidth resources) required-bandwidth)
                (>= (get power resources) required-power))
    false
  )
)

