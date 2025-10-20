import React, { useState } from 'react';
import { Table, Form, Input, InputNumber, Popconfirm, Select, Image, Button, DatePicker, Tag, Space, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCourse } from '../context/CourseContext';
import api from '../services/api';
import moment from 'moment';

const EditableCell = ({ editing, dataIndex, title, inputType, children, ...restProps }) => {
  let inputNode;

  if (dataIndex === 'amount') {
    inputNode = <InputNumber min={0} />;
  } else if (dataIndex === 'payment_status') {
    inputNode = (
      <Select
        options={[
          { value: 'Registrado', label: 'Registrado' },
          { value: 'Acreditado', label: 'Acreditado' },
          { value: 'Registrado/Sin acreditar', label: 'Registrado/Sin acreditar' },
        ]}
      />
    );
  } else if (dataIndex === 'payment_period') {
    inputNode = (
      <Select
        options={[
          { value: 'first', label: 'Primer Período' },
          { value: 'second', label: 'Segundo Período' },
        ]}
      />
    );
  } else if (dataIndex === 'date') {
    inputNode = <DatePicker format="YYYY-MM-DD" />;
  } else {
    inputNode = <Input />;
  }

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `Por favor ingresa ${title}!` }]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const PaymentsTable = ({ payments, setPayments }) => {
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const { selectedCourseId } = useCourse();

  const isEditing = (record) => record.id === editingId;

  const edit = (record) => {
    form.setFieldsValue({
      amount: record.amount || 0,
      date: record.date ? moment(record.date, 'YYYY-MM-DD') : null,
      payment_period: record.payment_period || 'first',
      payment_status: record.payment_status || 'Registrado',
    });
    setImageFile(record.payment_image || null);
    setEditingId(record.id);
  };

  const cancel = () => {
    setEditingId('');
    setImageFile(null);
  };

  const save = async (id) => {
    try {
      await form.validateFields();
      const row = form.getFieldsValue();
      const item = payments.find((payment) => payment.id === id);

      if (!item) {
        message.error('ID no encontrado para la actualización');
        return;
      }

      const updatedAmount = parseFloat(row.amount);
      if (isNaN(updatedAmount)) {
        message.error('El monto ingresado no es válido.');
        return;
      }

      const updatedRow = {
        ...row,
        amount: updatedAmount,
        date: row.date ? row.date.format('YYYY-MM-DD') : '',
        payment_image: imageFile || item.payment_image,
        id: item.id,
        course_id: selectedCourseId,
      };

      await api.put(`/payments/${item.id}`, updatedRow);

      const newData = payments.map((payment) =>
        payment.id === id ? { ...payment, ...updatedRow } : payment
      );

      setPayments(newData);
      setEditingId('');
      setImageFile(null);
      message.success('Pago actualizado con éxito');
    } catch (errInfo) {
      message.error('Error al actualizar el pago');
    }
  };

  const deletePayment = async (id) => {
    try {
      await api.delete(`/payments/${id}`);
      setPayments(payments.filter((payment) => payment.id !== id));
      message.success('Pago eliminado con éxito');
    } catch (error) {
      message.error('Error al eliminar el pago');
    }
  };

  const columns = [
    { title: 'Payment ID', dataIndex: 'id', key: 'id' },
    { title: 'Student ID', dataIndex: 'student_id', key: 'student_id' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', editable: true, render: (amount) => `$${amount}` },
    { title: 'Date', dataIndex: 'date', key: 'date', editable: true },
    {
      title: 'Payment Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      editable: true,
      render: (status) => {
        let color;
        switch (status) {
          case 'Registrado':
            color = 'blue';
            break;
          case 'Acreditado':
            color = 'green';
            break;
          case 'Registrado/Sin acreditar':
            color = 'orange';
            break;
          default:
            color = 'gray';
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Receipt',
      dataIndex: 'payment_image',
      key: 'payment_image',
      render: (_, record) => record.payment_image ? <Image width={100} src={record.payment_image} /> : 'Sin imagen',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => edit(record)} disabled={editingId !== ''}>
            Editar
          </Button>
          <Popconfirm title="¿Eliminar este pago?" onConfirm={() => deletePayment(record.id)}>
            <Button danger icon={<DeleteOutlined />}>Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <Form form={form} component={false}>
      <Table
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        bordered
        dataSource={payments}
        columns={mergedColumns}
        rowKey="id"
        scroll={{ x: true }}
      />
    </Form>
  );
};

export default PaymentsTable;

