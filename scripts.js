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

function alertOnFailCallback(scopeName, callback, alertFn=alert) {
    return (...args) => alertOnFail(scopeName, () => callback(...args), alertFn)
}

function setNavbarActive(idx) {
    const navbar = _getNavbar()
    const navbarItems = navbar.querySelector(".navbar-nav")
    const navbarItem = navbarItems.children[idx]
    navbarItem.querySelector("a").classList.add("active")
}

function navigate(href) {
    alertOnFail('navigate', () => {
        const navbar = _getNavbar()
        const contentContainer = navbar.querySelector(".navbar-collapse")
        if (contentContainer.classList.contains("show")) {
            const toggler = navbar.querySelector(".navbar-toggler")
            toggler.click()
            setTimeout(() => {
                window.location.href = href
            }, 400)
        } else {
            window.location.href = href
        }
    })
}

function _getNavbar() {
    return document.getElementById('navbar')
}
