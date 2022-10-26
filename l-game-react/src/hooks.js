import React, { useRef } from 'react'
import { findDOMNode } from 'react-dom'

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

/**
 * Sometimes when cloning React components, you want to
 * have a ref to some child element without destroying the
 * parent's ref to the element. This hook creates a new ref
 * to use that updates each ref passed to this hook.
 * @param  {...React.RefObject} refs 
 */
export function useMultipleRefs(...refs) {
    return (handle) => {
        for (const ref of refs) {
            if (typeof ref === "function") {
                ref(handle)
            } else {
                ref.current = handle
            }
        }
    }
}
