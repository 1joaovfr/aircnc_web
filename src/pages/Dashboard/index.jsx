import { Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import socketio from 'socket.io-client';

import './styles.css';

export function Dashboard(){
    const [spots, setSpots ] = useState([])
    const preview = 'http://localhost:3338/files';
    const [requests, setRequests] = useState([])
    
    const user_id = localStorage.getItem('user');
    const socket = useMemo( ()=> socketio('http://localhost:3338',{
        query: { user_id }
    }),[user_id])
    
    useEffect( () => {
        // console.log('socket: ', socket);
        // console.log('socket conectado', socket.connected)

        const handleBookingRequest = (data) => {
            console.log('Evento booking_request recebido no frontend', data)
            setRequests((prev) =>{
                // some = verifica se pelo menos um elemento de um array satisfaz a condição de teste fornecida
                const existe = prev.some((req) => req._id = data._id)
                return existe ? prev : [ ...prev, data]
            })
        }

        const setupListeners = () =>{
            //Primeiro remove para garantia que não existam multiplos listeners
            socket.off('booking_request', handleBookingRequest)
            socket.on('booking_request', handleBookingRequest)
        }

        if (socket.connected){
            console.log('Socket já estava conectado', socket)
        } else {
            console.log('...Aguardando conexão do socket...');
            socket.on('connect', () =>{
                console.log('Socket conectado após delay');
                setupListeners()
            })
        }

        return () => {
            socket.off('booking_request', handleBookingRequest)
        }

    },[socket])


    useEffect( () => {
        async function loadSpots(){
            const user_id = localStorage.getItem('user');
            const response = await api.get('/dashboard', {
                headers: { user_id }
            });

            setSpots(response.data);
        }

        loadSpots()
    }, [])

    async function handleAccept(id){
        await api.post(`/bookings/${id}/approvals`)
        setRequests(requests.filter(request => request._id !== id))
    }
    async function handleReject(id){
        await api.post(`/bookings/${id}/rejections`)
        setRequests(requests.filter(request => request._id !== id))
    }

    return (
        <>
        <ul className='notifications'>
        {requests.map(request => (
        <li key={request._id}>
            <p>
                <strong>{request.user.email}</strong> está solicitando uma reserva em: &nbsp;
                <strong>{request.spot.company}</strong> para a data: &nbsp;
                <strong>{request.date}</strong>
            </p>
            <button className='accept' onClick={()=> handleAccept(request._id)}>ACEITAR</button>
            <button className='reject' onClick={()=> handleReject(request._id)}>REJEITAR</button>
        </li>
        ))}
        </ul>
        <ul className='spot-list'>
            {spots.map(spot => (
                <li key={spot._id}>
                    <header style={{ backgroundImage: `url(${preview}/${spot.thumbnail})`}} />
                    <strong>{spot.company}</strong>
                    <span>{spot.price ? `R$${spot.price}` : 'GRATUITO' }</span>
                </li>
            ))
            }

        </ul>
            <Link to='/new'>
                <button className='btn'>Cadastrar novo Spot</button>
            </Link>
        </>
    )
}