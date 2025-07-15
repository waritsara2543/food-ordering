-- Insert default menu items
INSERT INTO menu_items (name, price, image, category, description) VALUES
('โค้ก', 20.00, '/placeholder.svg?height=200&width=200', 'drinks', 'เครื่องดื่มอัดลม'),
('เป๊ปซี่', 20.00, '/placeholder.svg?height=200&width=200', 'drinks', 'เครื่องดื่มอัดลม'),
('น้ำเปล่า', 10.00, '/placeholder.svg?height=200&width=200', 'drinks', 'น้ำดื่มบริสุทธิ์'),
('สไปรท์', 20.00, '/placeholder.svg?height=200&width=200', 'drinks', 'เครื่องดื่มอัดลมรสเลมอน'),
('น้ำส้ม', 25.00, '/placeholder.svg?height=200&width=200', 'drinks', 'น้ำส้มคั้นสด'),
('แซนวิชแฮม', 45.00, '/placeholder.svg?height=200&width=200', 'food', 'แซนวิชแฮมชีส'),
('แซนวิชทูน่า', 50.00, '/placeholder.svg?height=200&width=200', 'food', 'แซนวิชทูน่าสลัด'),
('แซนวิชไข่', 35.00, '/placeholder.svg?height=200&width=200', 'food', 'แซนวิชไข่ต้ม'),
('แซนวิชชีส', 40.00, '/placeholder.svg?height=200&width=200', 'food', 'แซนวิชชีสละลาย'),
('แซนวิชผักสลัด', 38.00, '/placeholder.svg?height=200&width=200', 'food', 'แซนวิชผักสดสลัด')
ON CONFLICT DO NOTHING;
