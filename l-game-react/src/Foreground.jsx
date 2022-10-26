import './Foreground.css'

/**
 * Some selection logic gets funky when z-index isn't
 * controlled. That's where this component comes in.
 * 
 * @param {{
 *      foregroundLevel: number,
 *      children: React.ReactNode,
 * }} props
 */
export default function Foreground({foregroundLevel=0, children}) {
    const foregroundClass = foregroundLevel > 0 ?
        `isForeground${foregroundLevel}` : ""
    return (
        <div className={`Foreground ${foregroundClass}`}>
            {children}
        </div>
    )
}
