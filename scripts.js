async function loadHtml(file, containerId) {
    const htmlResponse = await fetch(file)
    const htmlElementText = await htmlResponse.text()
    const container = document.getElementById(containerId)
    container.innerHTML = htmlElementText
}

async function alertOnFail(scopeName, callback, alertFn=alert) {
    try {
        await callback()
    } catch (e) {
        alertFn(`In "${scopeName}" -- ${e}`)
    }
}
