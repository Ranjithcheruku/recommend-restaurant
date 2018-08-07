import React, { Component, Fragment } from 'react';
import './assets/style.css'
import Marker from './assets/marker.svg';
import _ from 'lodash';
import {
    Button,
    Header,
    Image,
    Modal,
    Rating,
    Loader,
    List,
    Icon
} from 'semantic-ui-react'


let mapsScript, marker, map, directionsService, directionsDisplay;
let restaurents, markers = [];


class Main extends Component {

    state = {
        lat : null,
        lon : null,
        userLocation : {
            lat : null,
            lon : null
        },
        haveLocation : true,
        showModal : false,
        restaurant : {},
        showDirections : false,
        showSaved : false
    }

    componentWillMount(){
        mapsScript = document.createElement('script');
        mapsScript.setAttribute(
            "src",
            `https://maps.googleapis.com/maps/api/js?key=AIzaSyCC7YHjQGGdP6w05RDrhdfrSImE6u7m6hc&libraries=places&${new Date().getTime()}`
        )
        document.head.appendChild(mapsScript)
    }

    componentDidMount(){
        if(mapsScript){
            mapsScript.onload=((e) => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                        this.setState({
                            lat : parseFloat(position.coords.latitude),
                            lon : parseFloat(position.coords.longitude),
                            userLocation : {
                                lat : parseFloat(position.coords.latitude),
                                lon : parseFloat(position.coords.longitude),
                            }
                        })
                        this.initMap()
                    }, () => this.setState({
                        haveLocation : false
                    }))
                }
            })
		}
    }

    componentWillUnmount(){
        this.setState({
            lat : null,
            lon : null,
            userLocation : {
                lat : null,
                lon : null
            },
            haveLocation : true,
            showModal : false,
            restaurant : {},
            showDirections : false
        })
    }

    initMap(){
        var centerLatLng = new google.maps.LatLng(this.state.lat,this.state.lon);
        var mapOptions = {
            zoom: 18,
            center: centerLatLng,
            fullscreenControl : false,
            mapTypeControl : false,
            streetViewControl : false,
        }
        map = new google.maps.Map(document.getElementById('map'), mapOptions);
        this.getRestaurantInfo()
        map.addListener('dragend', ()=>{
            if(!this.state.showDirections){
                this.clearMap();
                this.setState({
                    lat : parseFloat(map.getCenter().lat()),
                    lon : parseFloat(map.getCenter().lng()),
                })
                this.getRestaurantInfo()
            }
        })
    }

    getRestaurantInfo = () => {
        const centerLatLng = new google.maps.LatLng(this.state.lat,this.state.lon);
        const places = new google.maps.places.PlacesService(map)
        places.nearbySearch({
            location : centerLatLng,
            radius : 500,
            type : ["restaurant"]
        }, (results, status) => {
            if(status == "OK"){
                restaurents = results;
                for (let restaurant of restaurents){
                    const centerLatLng = new google.maps.LatLng(restaurant.geometry.location.lat(),restaurant.geometry.location.lng());
                    marker = new google.maps.Marker({
                        position: centerLatLng,
                        icon : {
                            url: Marker,
                            scaledSize: new google.maps.Size(50, 50),
                            origin: new google.maps.Point(0,0),
                            anchor: new google.maps.Point(0, 0)
                        },
                        map: map
                    })
                    marker.addListener('click', ()=>{
                        this.setState({
                            showModal : true,
                            restaurant : restaurant
                        })
                    })
                    markers.push(marker)
                }
            }
        })
    }

    

    clearMap = () => {
        markers.forEach(marker => marker.setMap(null));
    }

    showDirections = () => {
        this.setState({
            showModal : false,
            showDirections : true
        })
        this.clearMap();
        directionsService = new google.maps.DirectionsService;
        directionsDisplay = new google.maps.DirectionsRenderer;
        directionsDisplay.setMap(map);
        directionsService.route({
            origin : `${this.state.userLocation.lat},${this.state.userLocation.lon}`,
            destination : `${this.state.restaurant.geometry.location.lat()},${this.state.restaurant.geometry.location.lng()}`,
            travelMode: 'DRIVING'
        }, function(response, status) {
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
            }
        })
    }

    hideDirections = () => {
        this.setState({showDirections : false})
        directionsDisplay.setMap(null);
        this.getRestaurantInfo()
    }

    save = () => {
        let savedRestaurants = localStorage.getItem('restaurants') || '[]';
        savedRestaurants = JSON.parse(savedRestaurants);
        savedRestaurants.push(this.state.restaurant)
        localStorage.setItem('restaurants', JSON.stringify(savedRestaurants));
        this.setState({showModal : false})
    }

    delete = () => {
        let savedRestaurants = localStorage.getItem('restaurants');
        if(savedRestaurants){
            savedRestaurants = JSON.parse(savedRestaurants);
            _.remove(savedRestaurants, r => r.place_id === this.state.restaurant.place_id);
            localStorage.setItem('restaurants', JSON.stringify(savedRestaurants));
            this.setState({showModal : false})
        }
    }

    showSaved = () => {
        this.setState({showSaved : true})
    }

    hideSaved = () => {
        this.setState({showSaved : false})
    }

    showDirectionsForPreferedLocation = (restaurant) => {
        this.setState({
            showSaved : false,
            showDirections : true
        })
        this.clearMap();
        directionsService = new google.maps.DirectionsService;
        directionsDisplay = new google.maps.DirectionsRenderer;
        directionsDisplay.setMap(map);
        directionsService.route({
            origin : `${this.state.userLocation.lat},${this.state.userLocation.lon}`,
            destination : `${restaurant.geometry.location.lat},${restaurant.geometry.location.lng}`,
            travelMode: 'DRIVING'
        }, function(response, status) {
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
            }
        })
    }

    renderListItem = ({restaurant, key}) => {
        return(
            <List.Item key={key}>
                <List.Content floated='right'>
                    <Button primary icon onClick={()=>this.showDirectionsForPreferedLocation(restaurant)}>
                        <Icon name='level up alternate' />
                    </Button>
                </List.Content>
                <Image
                    avatar
                    src={Marker}
                />
                <List.Content style={{padding : 10}}>{restaurant.name}</List.Content>
            </List.Item>
        )
    }

    renderList = ({savedRestaurants}) => <List >
        {savedRestaurants.map((restaurant, index)=> this.renderListItem({restaurant, key: index}))}
    </List>

    renderSavedListModal = ({savedRestaurants}) => {
        const showList = savedRestaurants && savedRestaurants.length > 0;
        return <Modal open={this.state.showSaved} size={"mini"}>
            <Modal.Header>Saved</Modal.Header>
            <Modal.Content>
                <Modal.Description>
                    {
                        (showList) && this.renderList({savedRestaurants})
                    }
                    {
                        (!showList) && <p>
                            No restarants added in prefrances
                        </p>
                    }
                </Modal.Description>
            </Modal.Content>
            <Modal.Actions>
                <Button negative onClick={()=> this.hideSaved()}>
                    Close
                </Button>
            </Modal.Actions>
        </Modal>
    }

    renderRestaurant = ({restaurant, isSaved, image}) => {
        return <Modal open={true} size={"mini"}>
            <Modal.Header>{restaurant.name}</Modal.Header>
            <Modal.Content image>
                {
                    image && <Image
                        wrapped
                        size='medium'
                        src={image}
                    />
                }
            </Modal.Content>
            <Modal.Content>
                <Modal.Description>
                    <div>
                        <div style={{display : "inline-block"}}>
                            <Rating
                                maxRating={5}
                                icon='star'
                                rating = {restaurant.rating}
                                disabled = {true}
                            /> ({restaurant.rating})
                        </div>
                        <div style={{display : "inline-block", float : "right"}}>
                            {(restaurant.name) ? <span style={{fontSize : 15, color : "green"}}>
                                    Open now
                                </span> : <span style={{fontSize : 15, color : "red"}}>
                                    Closed
                                </span>
                            }
                        </div>
                    </div>
                </Modal.Description>
            </Modal.Content>
            <Modal.Actions>
                <Button negative onClick={()=> {this.setState({showModal : false})}}>
                    Close
                </Button>
                {
                    (isSaved) ? <Button secondary onClick={()=> this.delete()}>
                        Remove
                    </Button> : <Button secondary onClick={()=> this.save()}>
                        Save
                    </Button>
                }
                <Button color='blue' onClick={()=> this.showDirections()}>
                    Get Directions
                </Button>
            </Modal.Actions>
        </Modal>
    }

    render() {
        const {
            lat,
            lon,
            userLocation,
            haveLocation = true,
            showModal = false,
            restaurant = {},
            showDirections = false,
            showSaved = false
        } = this.state;

        const image = restaurant.photos && restaurant.photos[0].getUrl({maxWidth : 500, maxHeight : 500});
        
        let savedRestaurants = JSON.parse(localStorage.getItem('restaurants'));
       
        const isSaved = savedRestaurants && Object.keys(restaurant).length && savedRestaurants.find(r => r.place_id === restaurant.place_id);

        const loading = !lat && !lon && haveLocation;
        const noLocation = !lat && !lon && !haveLocation;
        const showMap = lat && lon && haveLocation;

        if(showMap){
            return (
                <Fragment>
                    <div className="container" id="map"></div>

                    <Button secondary className="map_adjust_button2" onClick = {()=> this.showSaved()}>
                        Saved Restaurants
                    </Button>

                    {
                        showDirections && <Button negative className="map_adjust_button" onClick = {()=> this.hideDirections()}>
                            Hide Directions
                        </Button>
                    }

                    {showModal && this.renderRestaurant({restaurant, isSaved, image})}

                    {showSaved && this.renderSavedListModal({savedRestaurants})}
                </Fragment>
            )
        }
        if(loading){
            return(
                <div className="container">
                    <Loader active size="large" inline='centered' className="loader">
                        Loading map...
                    </Loader>
                </div>
            )
        }
        if(noLocation){
            return(
                <div className="container">
                    <div className="errorInfo">
                        No access to location.
                    </div>
                </div>
            )
        }
        return <div></div>
    }
}


export default Main;
