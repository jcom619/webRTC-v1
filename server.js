const webSocketServ = require('ws').Server;


const wss = new webSocketServ({
    port: 9090
})

const users = {};
const otherUser = null;
wss.on('connection', function (conn) {
    console.log("User connected");

    let on = conn.on('message', function (message) {
        let data;

        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log("Invalid JSON");
            data = {};
        }

        if (data.type === "login") {
            if (users[data.name]) {
                sendToOtherUser(conn, {
                    type: "login",
                    success: false
                })
            } else {
                users[data.name] = conn;
                conn.name = data.name

                sendToOtherUser(conn, {
                    type: "login",
                    success: true
                })
            }

        } else if (data.type === "offer") {
            const connect = users[data.name];
            if (connect != null) {
                conn.otherUser = data.name;

                sendToOtherUser(connect, {
                    type: "offer",
                    offer: data.offer,
                    name: conn.name
                })
            }
        } else if (data.type === "answer") {
            var connect = users[data.name];

            if (connect != null) {
                conn.otherUser = data.name
                sendToOtherUser(connect, {
                    type: "answer",
                    answer: data.answer
                })
            }

        } else if (data.type === "candidate") {
            const connect = users[data.name];

            if (connect != null) {
                sendToOtherUser(connect, {
                    type: "candidate",
                    candidate: data.candidate
                })
            }
        } else if (data.type === "reject") {
            const connect = users[data.name];

            if (connect != null) {
                sendToOtherUser(connect, {
                    type: "reject",
                    name: conn.name
                })
            }
        } else if (data.type === "accept") {
            const connect = users[data.name];

            if (connect != null) {
                sendToOtherUser(connect, {
                    type: "accept",
                    name: conn.name
                })
            }
        } else if (data.type === "leave") {
            const connect = users[data.name];
            connect.otherUser = null;

            if (connect != null) {
                sendToOtherUser(connect, {
                    type: "leave"
                })
            }

        } else {
            sendToOtherUser(conn, {
                type: "error",
                message: "Command not found: " + data.type
            });
        }


    });
    conn.on('close', function () {
        console.log('Connection closed');
        if(conn.name){
            delete users[conn.name];
            if(conn.otherUser){
                var connect = users[conn.otherUser];
                conn.otherUser = null;

                if(conn != null){
                    sendToOtherUser(connect, {
                        type:"leave"
                    } )
                }
            }
        }
    })

    conn.send("Hello World");

})

function sendToOtherUser(connection, message) {
    connection.send(JSON.stringify(message))
}
