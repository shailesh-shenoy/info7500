import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs
} from '@chakra-ui/react';
import Header from './components/Header';

function App() {
  return (
    <Box bg="gray.900" minHeight="100%" py={8}>
      <Container bg="gray.100" maxW="4xl" rounded="2xl" minHeight="90%">
        <Header />
        <Tabs isFitted variant="enclosed-colored">
          <TabList mb="1em">
            <Tab>Deployment</Tab>
            <Tab>Contract Info</Tab>
            <Tab>Bid</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <p>one!</p>
            </TabPanel>
            <TabPanel>
              <p>two!</p>
            </TabPanel>
            <TabPanel>
              <p>three!</p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
}

export default App;
