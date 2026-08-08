import React from 'react'
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useContext, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';


export default function History() {

    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);

    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    routeTo("/login");
                }
            }
        }
        fetchHistory();
    }, [])

    return (
        <div>
                           <IconButton onClick={() =>{
                            routeTo("/home")
                        }}>
                            <HomeIcon/>
                        </IconButton>
            {
                meetings.map((e) => {
                    return (
                        <>
                        <Card variant="outlined" key={e._id}>
    <CardContent>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            Meeting Code: {e.meetingCode}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            Date: {new Date(e.date).toLocaleString()}
        </Typography>
    </CardContent>
    <CardActions></CardActions>
</Card>
                        </>
                    )
                })
            }
        </div>
    )
}