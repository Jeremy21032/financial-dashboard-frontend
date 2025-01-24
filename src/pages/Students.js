import React, { useState, useEffect , useRef} from "react";
import api from "../services/api";
import AddStudentForm from "../components/AddStudentForm";
import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Space, Table } from 'antd';
import Highlighter from 'react-highlight-words';
import { fetchStudents } from "../utils/dbUtils";

const Students = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchStudents(setStudents);
  }, []);


  const handleStudentAdded = () => {
    fetchStudents(setStudents);
  };
/*   <AddStudentForm onStudentAdded={handleStudentAdded} />
 */
const [searchText, setSearchText] = useState('');
const [searchedColumn, setSearchedColumn] = useState('');
const searchInput = useRef(null);
const handleSearch = (selectedKeys, confirm, dataIndex) => {
  confirm();
  setSearchText(selectedKeys[0]);
  setSearchedColumn(dataIndex);
};
const handleReset = (clearFilters) => {
  clearFilters();
  setSearchText('');
};
const getColumnSearchProps = (dataIndex) => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
    <div
      style={{
        padding: 8,
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Input
        ref={searchInput}
        placeholder={`Search ${dataIndex}`}
        value={selectedKeys[0]}
        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
        onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
        style={{
          marginBottom: 8,
          display: 'block',
        }}
      />
      <Space>
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
          icon={<SearchOutlined />}
          size="small"
          style={{
            width: 90,
          }}
        >
          Search
        </Button>
        <Button
          onClick={() => clearFilters && handleReset(clearFilters)}
          size="small"
          style={{
            width: 90,
          }}
        >
          Reset
        </Button>
        <Button
          type="link"
          size="small"
          onClick={() => {
            confirm({
              closeDropdown: false,
            });
            setSearchText(selectedKeys[0]);
            setSearchedColumn(dataIndex);
          }}
        >
          Filter
        </Button>
        <Button
          type="link"
          size="small"
          onClick={() => {
            close();
          }}
        >
          close
        </Button>
      </Space>
    </div>
  ),
  filterIcon: (filtered) => (
    <SearchOutlined
      style={{
        color: filtered ? '#1677ff' : undefined,
      }}
    />
  ),
  onFilter: (value, record) =>
    record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
  filterDropdownProps: {
    onOpenChange(open) {
      if (open) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  },
  render: (text) =>
    searchedColumn === dataIndex ? (
      <Highlighter
        highlightStyle={{
          backgroundColor: '#ffc069',
          padding: 0,
        }}
        searchWords={[searchText]}
        autoEscape
        textToHighlight={text ? text.toString() : ''}
      />
    ) : (
      text
    ),
});
const columns = [
  {
    title: 'Id',
    dataIndex: 'id',
    key: 'id',
    width: '10%',
    ...getColumnSearchProps('name'),
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: '100%',
    ...getColumnSearchProps('name'),
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
    ...getColumnSearchProps('email'),
    sorter: (a, b) => a.email.length - b.email.length,
    sortDirections: ['descend', 'ascend'],
  },
];
return <Table columns={columns} dataSource={students} rowKey="id"/>;
};

export default Students;
