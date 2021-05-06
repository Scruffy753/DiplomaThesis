import React, { Component } from 'react';

class Actions extends Component{

    render() {
        return (
            <div>
            <h3>Actions </h3>
                <p>
                    <button type="button" className="btn btn-primary" onClick={this.createOrder}>Primary</button>
                </p>
            </div>
        );
    }
}

export default Actions;