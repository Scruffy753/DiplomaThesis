import Web3 from 'web3';
import low from 'lowdb';
import FileSync from "lowdb";

async function loadWeb3() {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum)
        await window.ethereum.enable()
    }
    else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
        window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
}


export var storeAPI = {
     storeAdress : "0xa912c38414559B1f0cAfB2C0192A10D017A2d144",
     getOrder: function(){
        return {
            "id": 2,
            "products" : [
                {
                    "id": "9868709",
                    "name":"iPhone",
                    "description": "The iPhone has a sleek, minimalist design, and differs from other smartphones in its lack of buttons.",
                    "cost": 2,
                    "refundable": true,
                    "tax": "20",
                    "quantity": 1,
                    "returned": false
                },
                { "id": "27362973",
                    "name":"Custom Belt",
                    "description": "Nice custom made belt.",
                    "cost": 2,
                    "refundable": false,
                    "tax": "20",
                    "quantity": 1,
                    "returned": true
                }
            ],
            "cost": 5,
            "delivererAddress" : "0xcb878373Bd62d54EfFEd828B489EC2911F22D10a",
            "deliveryAddress" : "Cierne, U Flora 02312, Slovensko",
            "storeAdress": this.storeAdress
        }
    },

    saveProposalForOrderId( orderid, amount, reason ) {
        // const adapter = new FileSync('db.json')
        // const db = low(adapter)
        //
        // db.defaults({ proposals: [], count: 0 }).write()
        //
        // db.get('proposals')
        //     .push({ orderId: orderid, reason: reason, amount: amount})
        //     .write()
    },

    getProposal( orderId  ){

        return { orderId: orderId, reason: "reason", amount: 1}
        // const adapter = new FileSync('db.json')
        // const db = low(adapter)
        //
        // db.defaults({ proposals: [], count: 0 }).write()
        //
        //
        // return db.get('proposals')
        //     .find({ orderId: orderId })
        //     .value()
    }
}


export var person = {
    firstName: "John",
    lastName : "Doe",
    id       : 5566,
    fullName : function() {
        return this.firstName + " " + this.lastName;
    }
};





