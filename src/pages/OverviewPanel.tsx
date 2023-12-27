import {Container} from '@mui/material';
import ControlGrid from '../components/ControlGrid';

interface ConnectionProps {
    connectionSuccess: boolean
}
function OverviewPanel({connectionSuccess}: ConnectionProps) {

    return (
        <div>
            <Container maxWidth="lg" sx={{mt: 1, mb: 1}}>
                <ControlGrid connectionSuccess={connectionSuccess}/>
            </Container>
        </div>

    );
}

export default OverviewPanel;