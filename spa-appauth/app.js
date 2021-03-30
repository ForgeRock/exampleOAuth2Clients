var loadData = function () {

    Promise.all([
        // Appropriate access tokens will be automatically included in these requests
        fetch("https://default.iam.example.com/am/oauth2/userinfo").then((resp) => resp.json()),
        fetch("https://default.iam.example.com/openidm/info/login").then((resp) => resp.json())
    ]).then((responses) => {
        document.getElementById('userDetails').innerText = JSON.stringify({
            "userinfo": responses[0],
            "info/login": responses[1]
        }, null, 4);
    });

};

loadData();
