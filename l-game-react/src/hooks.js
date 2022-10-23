import { useRef } from 'react'

/**
 * Returns a stable reference to a constant value that
 * never changes.
 * 
 * Be careful not to include potentially stale references in
 * the `valueFactory`. For this reason, the
 * "react-hooks/exhaustive-deps" rule has been enabled on this
 * function to indicate this type of error, and the caller must
 * explicitly specify an empty array for the `deps` argument
 */
export function useConstant(valueFactory, deps) {
    if (typeof deps !== "object" || !Array.isArray(deps) || deps.length !== 0) {
        throw new Error("useConstant() must be provided an empty deps array!")
    }

    const isInitializedRef = useRef(false)
    let value = null
    if (!isInitializedRef.current) {
        value = valueFactory()
        isInitializedRef.current = true
    }
    const valueRef = useRef(value)
    return valueRef.current
}
