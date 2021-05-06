export var OrderState = {
    CREATED: "CREATED",
    PAID : "PAID",
    ACCEPTED : "ACCEPTED",
    SHIPPED : "SHIPPED",
    CANCELLED : "CANCELLED",
    DELIVERED : "DELIVERED",
    COMPLETED : "COMPLETED",
    SENTBACK : "SENTBACK",
    RETURNED : "RETURNED",
    PROPOSALFORSETTLEMENT : "PROPOSALFORSETTLEMENT",
    FROZEN : "FROZEN",
    REFUNDED : "REFUNDED",

    getName : function( num ) {
        switch (num){
            case "0": return OrderState.CREATED
            case "1": return OrderState.PAID
            case "2": return OrderState.ACCEPTED
            case "3": return OrderState.SHIPPED
            case "4": return OrderState.CANCELLED
            case "5": return OrderState.DELIVERED
            case "6": return OrderState.COMPLETED
            case "7": return OrderState.SENTBACK
            case "8": return OrderState.RETURNED
            case "9": return OrderState.PROPOSALFORSETTLEMENT
            case "10": return OrderState.FROZEN
            case "11": return OrderState.REFUNDED
        }
    }
};

export var Role = {
    STORE: "STORE",
    CUSTOMER : "CUSTOMER",
    DELIVERER : "DELIVERER",
    PUBLIC : "PUBLIC",
    AUTHORITY : "PUBLIC",
};