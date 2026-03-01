const homeController = {

    const: getHome = (req, res) => {
        res.jason({
            message: 'GET request received for home page',
            username: 'Paul Joseph'
        })
    }
}

export default homeController;