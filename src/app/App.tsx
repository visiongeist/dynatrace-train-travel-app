import React, { useEffect, useState } from 'react';
import {
  AppHeader,
  AppName,
  Page,
  Flex,
  Heading,
  Paragraph,
  Grid,
} from '@dynatrace/strato-components-preview';
import { useDqlQuery } from '@dynatrace-sdk/react-hooks';
import { Borders, BoxShadows, Colors, Spacings } from '@dynatrace/strato-design-tokens';
import {
  DatePicker,
  FormField,
  SelectV2
} from '@dynatrace/strato-components-preview/forms';
import type { TableColumn } from '@dynatrace/strato-components-preview/tables';
import { DataTable } from '@dynatrace/strato-components-preview/tables';
import { Button } from '@dynatrace/strato-components-preview/buttons';
import { businessEventsClient } from '@dynatrace-sdk/client-classic-environment-v2';

const officeList = [
  {
    value: 'linz',
    display: 'Linz',
  },
  {
    value: 'vienna',
    display: 'Vienna',
  },
  {
    value: 'graz',
    display: 'Graz',
  },
  {
    value: 'innsbruck',
    display: 'Innsbruck',
  },
  {
    value: 'klagenfurt',
    display: 'Klagenfurt',
  },
  {
    value: 'hagenberg',
    display: 'Hagenberg',
  }
];

/**
 * Table Headers for Booked Travels
 */
const tableColumns: TableColumn[] = [
  {
    header: 'Date',
    accessor: 'travelDate',
    ratioWidth: 1,
  },
  {
    header: 'Person',
    accessor: 'user',
    ratioWidth: 1,
  },
  {
    header: 'From',
    accessor: 'from',
    ratioWidth: 1,
  },
  {
    header: 'To',
    accessor: 'to',
    ratioWidth: 1,
  },
];

/**
 * Fetches the current user information
 * @returns 
 */
const fetchCurrentUser = async () => {
  const response = await fetch("/platform/metadata/v1/user");
  const json = await response.json();
  return json;
}

export const App = () => {

  // ask for the currently logged in user
  const [currentUser, setCurrentUser] = useState(0);
  useEffect(() => {
    fetchCurrentUser().then((res) => setCurrentUser(res));
  }, []);

  // for the datepicker
  const [value, setValue] = useState<string | null>(null);

  // get travels from grail
  const travelsQuery = useDqlQuery({
    body: {
      query: `fetch bizevents | filter startsWith(event.type, "officetravel.process.")`,
      requestTimeoutMilliseconds: 10000,
    },
  });
  const travels = travelsQuery.data?.records || [];

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const bizevent = {
      specversion: '1.0',
      source: 'damien.app.officetravel',
      id: crypto.randomUUID().toString(),
      type: 'officetravel.process.booked',
      data: {
        user: currentUser['emailAddress'],
        travelDate: formData.get('travelDate'),
        from: formData.get('from'),
        to: formData.get('to')
      },
    };

    console.log(currentUser)

    try {
      await businessEventsClient
        .ingest({
          body: bizevent,
          type: 'application/cloudevent+json',
        })
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      travelsQuery.refetch();
    }, 1000);

  };

  return (
    <Page>
      <Page.Header>
        <AppHeader>
          <AppName />
        </AppHeader>
      </Page.Header>
      <Page.Main>
        <Flex gap={32} flexDirection="column" alignItems={'center'}>
          <Paragraph>
            WIP - This application is for demonstration purpose only to showcase some capabilities of the Dynatrace applications.
          </Paragraph>
          <Heading level={1}>🚂 Office Travels</Heading>
          <Flex
            style={{
              border: Colors.Border.Neutral.Default,
              borderRadius: Borders.Radius.Container.Subdued,
              background: Colors.Background.Surface.Default,
              boxShadow: BoxShadows.Surface.Raised.Rest,
              padding: Spacings.Size24,
              width: '90%',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              flexShrink: '0',
            }}
          >
            <DataTable fullWidth columns={tableColumns} data={travels} />
          </Flex>
          <Grid gap={32} gridTemplateColumns={'1fr 1fr'}>


            <Flex
              style={{
                border: Colors.Border.Neutral.Default,
                borderRadius: Borders.Radius.Container.Subdued,
                background: Colors.Background.Surface.Default,
                boxShadow: BoxShadows.Surface.Raised.Rest,
                padding: Spacings.Size24,
                width: '100%',
                minWidth: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                flexShrink: '0',
              }}
            >
              <Heading level={2}>Plan a new travel</Heading>
              <form onSubmit={handleSubmit}>
                <FormField id="travelDate" label="Select a date">
                  <DatePicker
                    id="datepicker"
                    name="travelDate"
                    value={value}
                    onChange={({ value }) => setValue(value)}
                  />
                </FormField>
                <Flex>
                  <FormField label="From">
                    <SelectV2 name='from'>
                      <SelectV2.Content>
                        {officeList.map((el) => (
                          <SelectV2.Option value={el.value} key={el.value}>
                            {el.display}
                          </SelectV2.Option>
                        ))}
                      </SelectV2.Content>
                    </SelectV2>
                  </FormField>
                  <FormField label="To">
                    <SelectV2 name='to'>
                      <SelectV2.Content>
                        {officeList.map((el) => (
                          <SelectV2.Option value={el.value} key={el.value}>
                            {el.display}
                          </SelectV2.Option>
                        ))}
                      </SelectV2.Content>
                    </SelectV2>
                  </FormField>
                </Flex>
                <Button color="primary" variant="emphasized" type="submit">
                  Schedule new travel
                </Button>
              </form>
            </Flex>
          </Grid>
        </Flex>
      </Page.Main>
    </Page>
  );
};
