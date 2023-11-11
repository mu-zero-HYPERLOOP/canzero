import * as React from 'react';
import DebugPanel from "./DebugPanel";
import ControlPanel from "./ControlPanel";
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import {
    MemoryRouter,
    Route,
    Routes,
    Link,
    matchPath,
    useLocation,
} from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';

function Router(props: { children?: React.ReactNode }) {
    const { children } = props;
    if (typeof window === 'undefined') {
        return <StaticRouter location="/">{children}</StaticRouter>;
    }

    return (
        <MemoryRouter initialEntries={['/']} initialIndex={0}>
            {children}
        </MemoryRouter>
    );
}

function useRouteMatch(patterns: readonly string[]) {
    const { pathname } = useLocation();

    for (let i = 0; i < patterns.length; i += 1) {
        const pattern = patterns[i];
        const possibleMatch = matchPath(pattern, pathname);
        if (possibleMatch !== null) {
            return possibleMatch;
        }
    }

    return null;
}

function MyTabs() {
    // You need to provide the routes in descendant order.
    // This means that if you have nested routes like:
    // users, users/new, users/edit.
    // Then the order should be ['users/add', 'users/edit', 'users'].
    const routeMatch = useRouteMatch(['/', '/DebugPanel']);
    const currentTab = routeMatch?.pattern?.path;

    return (
        <Tabs value={currentTab} variant="fullWidth">
            <Tab label="Control Panel" value="/" to="/" component={Link} />
            <Tab label="Debug Panel" value="/DebugPanel" to="/DebugPanel" component={Link} />
        </Tabs>
    );
}

function CurrentRoute() {
    const location = useLocation();

    return (
        <Typography variant="body2" sx={{ pb: 2 }} color="text.secondary">
            Current route: {location.pathname}
        </Typography>
    );
}

export default function TabsRouter() {
    return (
        <Router>
            <Box sx={{ width: '100%' }}>
                <MyTabs />
                <Routes>
                    <Route index element={<ControlPanel />} />
                    <Route path="DebugPanel" element={<DebugPanel />} />
                    <Route path="*" element={<CurrentRoute />} />
                </Routes>
            </Box>
        </Router>
    );
}
