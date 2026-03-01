const aboutController = {

    const: getAbout = (req, res) => {
        res.json({
            message: 'This is the about page of the backend!',
            username: 'Paul Joseph'
        });
    }
}

export default aboutController;