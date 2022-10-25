import './Foreground.css'

/**
 * Some selection logic gets funky when z-index isn't
 * controlled. That's where this component comes in.
 * 
 * @param {{
 *      isForeground: boolean,
 *      children: React.DOMAttributes,
 * }} props
 */
export default function Foreground({isForeground, children}) {
    const foregroundClass = isForeground ? "isForeground" : ""
    return (
        <div className={`Foreground ${foregroundClass}`}>
            {children}
        </div>
    )
}
