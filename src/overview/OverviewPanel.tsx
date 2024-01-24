import {Container} from '@mui/material';
import ControlGrid from './ControlGrid.tsx';
import {NodeInformation} from "../nodes/types/NodeInformation.ts";

interface OverviewProps {
    connectionSuccess: boolean
    nodes: NodeInformation[];
}
function OverviewPanel({connectionSuccess, nodes}: Readonly<OverviewProps>) {

    return (
        <div>
            <Container maxWidth="xl" sx={{mt: 0, mb: 0}}>
                <ControlGrid connectionSuccess={connectionSuccess} nodes={nodes}/>
            </Container>
        </div>

    );
}

export default OverviewPanel;