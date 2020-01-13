import React, { Component } from "react";
import "./Login.css";
import {Nav} from "react-bootstrap"; 

export default class Login extends Component {
	constructor(props) {
		super(props);

		this.state = {
			loginText: props.loginText,
			loginHref: props.loginHref
		};

	}

	render() {
		return ( 
			<div className="Login">
				<Nav.Link onClick={this.props.handleLogout} href={this.state.loginHref}>{this.state.loginText}</Nav.Link> 
			</div>
		);
	}
}