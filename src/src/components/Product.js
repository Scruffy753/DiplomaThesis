import React, { Component } from 'react';
import { OrderState, Role } from "./OrderState";

class Product extends Component{


    handleChceck( event ){
        console.log(event.target.value)
        this.props.callReturned( this.props.index )
    }

    constructor(props) {
        super(props)

        this.state = {
            count: ''
        }
        this.handleChceck = this.handleChceck.bind(this)

    }

    render() {
        return (
                <div className="card border-primary mb-3" >
                    <div className="card-header bg-transparent border-primary">#{this.props.product.id}</div>
                    <div className="card-body">
                        <h5 className="card-title">{this.props.product.name}</h5>
                        <p className="card-text">{this.props.product.description}</p>
                        <p className="card-text"> {this.props.product.refundable ?
                            <span className="badge bg-success">Returnable</span> :
                            <span className="badge bg-danger">Non-returnable</span>
                        }</p>
                        <p className="card-text">Tax: {this.props.product.tax}%</p>
                        { ( this.props.state === OrderState.DELIVERED &&
                            this.props.product.refundable
                        ) &&
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" onChange={this.handleChceck}/>
                                    <label className="form-check-label" htmlFor="flexCheckDefault">
                                        Return
                                    </label>
                            </div>
                        }

                    </div>
                    <div className="card-footer bg-transparent border-primary">{this.props.product.cost} ETH</div>
                </div>
        );
    }
}

export default Product;
