import {Container} from '@mui/material';
import ControlGrid from '../components/ControlGrid';

function OverviewPanel() {

    return (
        <div>
            <Container maxWidth="lg" sx={{mt: 1, mb: 1}}>
                <ControlGrid isConnecting={false}/>
            </Container>
        </div>

    );
}

export default OverviewPanel;