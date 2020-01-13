import React, { Component } from "react";


import {Navbar} from "react-bootstrap"; 
import "./App.css";
import Login from "./containers/Login"; 
import SmartPetFeeder from "./containers/SmartPetFeeder"; 

class App extends Component {
	constructor(props){
		super(props);
		this.state = {
			loginPage: [],
			smartPetFeederPage: [],
			loginText: "Log in with Google",
			isAuthenticated: false,
			loaded: false,
			loginName: "",
			imageUrl: ""
		}; 
	}
	handleLogout (e) {
		this.setState({isAuthenticated: false, loginName: "", imageUrl: "", smartPetFeederPage: null, loaded: false});
	}

	componentDidMount() {
		var loginPage = [];
	if(!this.state.isAuthenticated) {
			loginPage.push(<Login loginText="Sign in With Google" loginHref='/auth/login' key="Login" />); 
			this.setState({loginPage:loginPage}); 
			fetch('/auth').then(res=>res.json()).then(res=> {
				this.setState({isAuthenticated: res.isAuthenticated, loginName: res.loginName, imageUrl: res.imageUrl});
			});
		//	this.setState({isAuthenticated: true});
		}
	}
	componentDidUpdate () {
		if(this.state.isAuthenticated && !this.state.loaded) {
			let userPage = [];
			let loginPage = []; 
			loginPage.push(<Login loginText='Sign out' loginHref='/auth/logout' handleLogout={() => this.handleLogout()} /> ); 
			userPage.push(<SmartPetFeeder  loginName = {this.state.loginName} imageUrl = {this.state.imageUrl} />);
			this.setState({smartPetFeederPage: userPage, loaded: true, loginPage: loginPage}); 
		}
	}


	render() {
    return (
		<>
		  <Navbar className="navbar-brand" bg="primary" variant="dark" >
				<Navbar.Brand >Smart Pet Feeder</Navbar.Brand>
			</Navbar>
				{this.state.smartPetFeederPage ? this.state.smartPetFeederPage : <div></div>}
				{this.state.loginPage}
				
		</>
    );
  }
}

export default App;
