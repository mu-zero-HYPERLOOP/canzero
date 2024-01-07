import {Container} from '@mui/material';
import ControlGrid from './ControlGrid.tsx';

interface ConnectionProps {
    connectionSuccess: boolean
}
function OverviewPanel({connectionSuccess}: ConnectionProps) {

    return (
        <div>
            <Container maxWidth="xl" sx={{mt: 0, mb: 0}}>
                <ControlGrid connectionSuccess={connectionSuccess}/>
            </Container>
        </div>

    );
}

export default OverviewPanel;