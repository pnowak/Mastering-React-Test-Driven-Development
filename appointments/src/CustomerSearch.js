import React, { useEffect, useState, useCallback } from 'react';

const searchParams = (limit, after, searchTerm) => {
  let pairs = [];
  if (limit) {
    pairs.push(`limit=${limit}`);
  }
  if (after) {
    pairs.push(`after=${after}`);
  }
  if (searchTerm) {
    pairs.push(`searchTerm=${searchTerm}`);
  }
  if (pairs.length > 0) {
    return `?${pairs.join('&')}`;
  }
  return '';
};

const SearchButtons = ({ handleLimit, handleNext, handlePrevious }) => (
  <div className="button-bar">
    <button role="button" id="limit-10" value="10" onClick={handleLimit}>
      10
    </button>
    <button role="button" id="limit-20" value="20" onClick={handleLimit}>
      20
    </button>
    <button role="button" id="limit-50" value="50" onClick={handleLimit}>
      50
    </button>
    <button role="button" id="limit-100" value="100" onClick={handleLimit}>
      100
    </button>
    <button
      role="button"
      id="previous-page"
      onClick={handlePrevious}>
      Previous
    </button>
    <button role="button" id="next-page" onClick={handleNext}>
      Next
    </button>
  </div>
);

const CustomerRow = ({ customer }) => (
  <tr>
    <td>{customer.firstName}</td>
    <td>{customer.lastName}</td>
    <td>{customer.phoneNumber}</td>
    <td />
  </tr>
);

export const CustomerSearch = () => {
  const [limit, setLimit] = useState(10);
  const [customers, setCustomers] = useState([]);
  const [lastRowIds, setLastRowIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchTextChanged = ({ target: { value } }) =>
    setSearchTerm(value);
  
  const handleLimit = useCallback(({ target: { value } }) => {
    setLimit(value);
  }, [limit]);

  const handleNext = useCallback(() => {
    const currentLastRowId = customers[customers.length - 1].id;
    setLastRowIds([...lastRowIds, currentLastRowId]);
  }, [customers, lastRowIds]);

  const handlePrevious = useCallback(
    () => setLastRowIds(lastRowIds.slice(0, -1)),
    [lastRowIds]
  );

  useEffect(() => {
    const fetchData = async () => {
      let after;
      if (lastRowIds.length > 0)
        after = lastRowIds[lastRowIds.length - 1];
      const queryString = searchParams(limit, after, searchTerm);

      const result = await window.fetch(
        `/customers${queryString}`,
        {
          method: 'GET',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      setCustomers(await result.json());
    };

    fetchData();
  }, [limit, lastRowIds, searchTerm]);

  return (
    <React.Fragment>
      <input
        value={searchTerm}
        onChange={handleSearchTextChanged}
        placeholder="Enter filter text"
      />
      <SearchButtons
        handleLimit={handleLimit}
        handleNext={handleNext}
        handlePrevious={handlePrevious}
      />
      <table>
        <thead>
          <tr>
            <th>First name</th>
            <th>Last name</th>
            <th>Phone number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <CustomerRow customer={customer} key={customer.id} />
          ))}
        </tbody>
      </table>
    </React.Fragment>
  );
};
