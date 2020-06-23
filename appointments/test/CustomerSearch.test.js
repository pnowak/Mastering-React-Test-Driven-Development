import React from 'react';
import 'whatwg-fetch';
import { act } from 'react-dom/test-utils';
import { createContainer, withEvent } from './domManipulators';
import { CustomerSearch } from '../src/CustomerSearch';
import { fetchResponseOk } from './spyHelpers';

const oneCustomer = [
  { id: 1, firstName: 'A', lastName: 'B', phoneNumber: '1' }
];

const twoCustomers = [
  { id: 1, firstName: 'A', lastName: 'B', phoneNumber: '1' },
  { id: 2, firstName: 'C', lastName: 'D', phoneNumber: '2' }
];

const tenCustomers = Array.from('0123456789', id => ({ id }));

const anotherTenCustomers = Array.from('ABCDEFGHIJ', id => ({
  id
}));

describe('CustomerSearch', () => {
  let renderAndWait, container, element, elements, clickAndWait, changeAndWait;

  beforeEach(() => {
    ({
      renderAndWait,
      container,
      element,
      elements,
      clickAndWait,
      changeAndWait
    } = createContainer());
    jest
      .spyOn(window, 'fetch')
      .mockReturnValue(fetchResponseOk([]));
  });

  it('renders a table with four headings', async () => {
    await renderAndWait(<CustomerSearch />);
    const headings = elements('table th');
    expect(headings.map(h => h.textContent)).toEqual([
      'First name',
      'Last name',
      'Phone number',
      'Actions'
    ]);
  });

  it('fetches all customer data when component mounts', async () => {
    await renderAndWait(<CustomerSearch />);
    expect(window.fetch).toHaveBeenCalledWith('/customers?limit=10', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    });
  });

  it('renders all customer data in a table row', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(oneCustomer));
    await renderAndWait(<CustomerSearch />);
    const columns = elements('table > tbody > tr > td');
    expect(columns[0].textContent).toEqual('A');
    expect(columns[1].textContent).toEqual('B');
    expect(columns[2].textContent).toEqual('1');
  });

  it('renders multiple customer rows', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(twoCustomers));
    await renderAndWait(<CustomerSearch />);
    const rows = elements('table tbody tr');
    expect(rows[1].childNodes[0].textContent).toEqual('C');
  });

  it('has a next button', async () => {
    await renderAndWait(<CustomerSearch />);
    expect(element('button#next-page')).not.toBeNull();
  });

  it('requests next page of data when next button is clicked', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#next-page'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=10&after=9',
      expect.anything()
    );
  });

  it('displays next page of data when next button is clicked', async () => {
    const nextCustomer = [{ id: 'next', firstName: 'Next' }];
    window.fetch
      .mockReturnValueOnce(fetchResponseOk(tenCustomers))
      .mockReturnValue(fetchResponseOk(nextCustomer));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#next-page'));
    expect(elements('tbody tr').length).toEqual(1);
    expect(elements('td')[0].textContent).toEqual('Next');
  });

  it('has a previous button', async () => {
    await renderAndWait(<CustomerSearch />);
    expect(element('button#previous-page')).not.toBeNull();
  });

  it('moves back to first page when previous button is clicked', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#next-page'));
    await clickAndWait(element('button#previous-page'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=10',
      expect.anything()
    );
  });

  it('moves back one page when clicking previous after multiple clicks of the next button', async () => {
    window.fetch
      .mockReturnValueOnce(fetchResponseOk(tenCustomers))
      .mockReturnValue(fetchResponseOk(anotherTenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#next-page'));
    await clickAndWait(element('button#next-page'));
    await clickAndWait(element('button#previous-page'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=10&after=9',
      expect.anything()
    );
  });

  it('moves back multiple pages', async () => {
    window.fetch
      .mockReturnValueOnce(fetchResponseOk(tenCustomers))
      .mockReturnValue(fetchResponseOk(anotherTenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#next-page'));
    await clickAndWait(element('button#next-page'));
    await clickAndWait(element('button#previous-page'));
    await clickAndWait(element('button#previous-page'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=10',
      expect.anything()
    );
  });

  it.skip('previous button is disabled if the user is on the first page', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await act(async () => {
      expect(element('button#previous-page').disabled).toBeTruthy();
    });
  });

  it('has a search input field with a placeholder', async () => {
    await renderAndWait(<CustomerSearch />);
    expect(element('input')).not.toBeNull();
    expect(element('input').getAttribute('placeholder')).toEqual(
      'Enter filter text'
    );
  });

  it('performs search when search term is changed', async () => {
    await renderAndWait(<CustomerSearch />);
    await changeAndWait(element('input'), withEvent('input', 'name'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=10&searchTerm=name',
      expect.anything()
    );
  });

  it('includes search term when moving to next page', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await changeAndWait(element('input'), withEvent('input', 'name'));
    await clickAndWait(element('button#next-page'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=10&after=9&searchTerm=name',
      expect.anything()
    );
  });

  it('has a 10 limit button', async () => {
    await renderAndWait(<CustomerSearch />);
    expect(element('button#limit-10')).not.toBeNull();
  });

  it('requests ten customers by default', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=10',
      expect.anything()
    );
  });

  it('requests ten customers when you click in button 10', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#limit-10'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=10',
      expect.anything()
    );
  });

  it('includes ten customers when moving to next page', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#next-page'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=10&after=9',
      expect.anything()
    );
  });

  it('has a 20 limit button', async () => {
    await renderAndWait(<CustomerSearch />);
    expect(element('button#limit-20')).not.toBeNull();
  });

  it('requests twelve customers when you click in button 20', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#limit-20'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=20',
      expect.anything()
    );
  });

  it('includes twelve customers when moving to next page', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#limit-20'));
    await clickAndWait(element('button#next-page'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=20&after=9',
      expect.anything()
    );
  });

  it('has a 50 limit button', async () => {
    await renderAndWait(<CustomerSearch />);
    expect(element('button#limit-50')).not.toBeNull();
  });

  it('requests fifty customers when you click in button 50', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#limit-50'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=50',
      expect.anything()
    );
  });

  it('includes fifty customers when moving to next page', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#limit-50'));
    await clickAndWait(element('button#next-page'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=50&after=9',
      expect.anything()
    );
  });

  it('has a 100 limit button', async () => {
    await renderAndWait(<CustomerSearch />);
    expect(element('button#limit-100')).not.toBeNull();
  });

  it('requests hundred customers when you click in button 100', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#limit-100'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=100',
      expect.anything()
    );
  });

  it('includes hundred customers when moving to next page', async () => {
    window.fetch.mockReturnValue(fetchResponseOk(tenCustomers));
    await renderAndWait(<CustomerSearch />);
    await clickAndWait(element('button#limit-100'));
    await clickAndWait(element('button#next-page'));
    expect(window.fetch).toHaveBeenLastCalledWith(
      '/customers?limit=100&after=9',
      expect.anything()
    );
  });
});
