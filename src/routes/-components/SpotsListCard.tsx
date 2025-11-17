import { Button, Card, CardActions, CardContent, Typography } from "@mui/material"

const SpotsListCard: React.FC<any> = ({ spot }) => {
    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                    {spot?.address}
                </Typography>
                <Typography variant="h5" component="div">
                    {spot?.city}, {spot?.country}
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{spot?.name}</Typography>
                <Typography variant="body2">
                    {spot?.description}
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small">Learn More</Button>
            </CardActions>
        </Card>
    )
}

export default SpotsListCard;