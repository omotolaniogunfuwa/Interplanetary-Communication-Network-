;; Encryption Contract

(define-data-var next-key-id uint u0)

(define-map encryption-keys
  { key-id: uint }
  {
    owner: principal,
    public-key: (buff 64),
    algorithm: (string-ascii 20),
    expiration: uint
  }
)

(define-public (register-public-key (public-key (buff 64)) (algorithm (string-ascii 20)) (expiration uint))
  (let
    ((key-id (+ (var-get next-key-id) u1)))
    (var-set next-key-id key-id)
    (ok (map-set encryption-keys
      { key-id: key-id }
      {
        owner: tx-sender,
        public-key: public-key,
        algorithm: algorithm,
        expiration: expiration
      }
    ))
  )
)

(define-public (update-key-expiration (key-id uint) (new-expiration uint))
  (let
    ((key (unwrap! (map-get? encryption-keys { key-id: key-id }) (err u404))))
    (asserts! (is-eq (get owner key) tx-sender) (err u403))
    (ok (map-set encryption-keys
      { key-id: key-id }
      (merge key { expiration: new-expiration })
    ))
  )
)

(define-read-only (get-public-key (key-id uint))
  (map-get? encryption-keys { key-id: key-id })
)

(define-read-only (is-key-valid (key-id uint))
  (match (map-get? encryption-keys { key-id: key-id })
    key (< block-height (get expiration key))
    false
  )
)

