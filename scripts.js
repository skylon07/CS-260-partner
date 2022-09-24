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

function setNavbarName(name) {
    const navbar = _getNavbar()
    const navbarBrand = navbar.querySelector(".navbar-brand")
    navbarBrand.innerHTML = `Arcade -- ${name}`
}

function setNavbarActive(idx) {
    const navbar = _getNavbar()
    const navbarItems = navbar.querySelector(".navbar-nav")
    const navbarItem = navbarItems.children[idx]
    navbarItem.querySelector("a").classList.add("active")
}

function _getNavbar() {
    return document.getElementById('navbar')
}
