document.addEventListener('DOMContentLoaded', function() {
  // Khởi tạo dữ liệu
  const parkingData = {
    vehicles: [],
    monthlyTickets: [],
    dailyTickets: [],
    parkingHistory: []
  };

  // Lấy dữ liệu từ localStorage nếu có
  if (localStorage.getItem('parkingData')) {
    Object.assign(parkingData, JSON.parse(localStorage.getItem('parkingData')));
  }

  // Xử lý chuyển tab
  const navButtons = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.content-section');

  navButtons.forEach(button => {
    button.addEventListener('click', function() {
      const sectionId = this.getAttribute('data-section');
      
      navButtons.forEach(btn => btn.classList.remove('active'));
      sections.forEach(section => section.classList.remove('active'));
      
      this.classList.add('active');
      document.getElementById(sectionId).classList.add('active');
    });
  });

  // Xử lý thay đổi loại vé
  const ticketTypeRadios = document.querySelectorAll('input[name="ticketType"]');
  const dailyDateContainer = document.getElementById('dailyDateContainer');
  
  ticketTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'daily') {
        dailyDateContainer.classList.remove('hidden');
      } else {
        dailyDateContainer.classList.add('hidden');
      }
    });
  });

  // Gửi xe
  document.getElementById('checkInBtn').addEventListener('click', function() {
    const licensePlate = document.getElementById('licenseSend').value.trim();
    const ticketType = document.querySelector('input[name="ticketType"]:checked').value;
    const dailyDate = document.getElementById('dailyDate').value;
    
    if (!licensePlate) {
      alert('Vui lòng nhập biển số xe!');
      return;
    }
    
    if (ticketType === 'daily' && !dailyDate) {
      alert('Vui lòng chọn ngày áp dụng cho vé ngày!');
      return;
    }
    
    const existingVehicle = parkingData.vehicles.find(v => v.licensePlate === licensePlate);
    if (existingVehicle) {
      alert('Xe này đã được gửi trước đó!');
      return;
    }
    
    const checkInTime = new Date();
    const today = checkInTime.toISOString().split('T')[0];
    
    let isMonthly = false;
    let isDaily = false;
    
    if (ticketType === 'monthly') {
      if (!parkingData.monthlyTickets.includes(licensePlate)) {
        parkingData.monthlyTickets.push(licensePlate);
      }
      isMonthly = true;
    } else if (ticketType === 'daily') {
      parkingData.dailyTickets.push({
        licensePlate,
        date: dailyDate
      });
      isDaily = true;
    }
    
    const vehicle = {
      licensePlate,
      checkInTime,
      isMonthly,
      isDaily
    };
    
    parkingData.vehicles.push(vehicle);
    saveData();
    
    alert(`Đã gửi xe thành công!\nBiển số: ${licensePlate}\nGiờ vào: ${formatTime(checkInTime)}\nLoại vé: ${
      isMonthly ? 'Vé tháng' : isDaily ? 'Vé ngày' : 'Vé thường'
    }`);
    
    document.getElementById('licenseSend').value = '';
    document.getElementById('dailyDate').value = '';
    document.querySelector('input[name="ticketType"][value="normal"]').checked = true;
    dailyDateContainer.classList.add('hidden');
    updateReport();
  });

  // Trả xe - Kiểm tra thông tin
  document.getElementById('returnBtn').addEventListener('click', function() {
    const licensePlate = document.getElementById('licenseReturn').value.trim();
    const returnInfo = document.getElementById('returnInfo');
    
    if (!licensePlate) {
      alert('Vui lòng nhập biển số xe!');
      return;
    }
    
    const vehicleIndex = parkingData.vehicles.findIndex(v => v.licensePlate === licensePlate);
    if (vehicleIndex === -1) {
      returnInfo.innerHTML = `<p style="color: #e74c3c;">Không tìm thấy xe này trong bãi!</p>`;
      returnInfo.classList.remove('hidden');
      return;
    }
    
    const vehicle = parkingData.vehicles[vehicleIndex];
    const checkInTime = new Date(vehicle.checkInTime);
    const currentTime = new Date();
    const durationHours = ((currentTime - checkInTime) / (1000 * 60 * 60)).toFixed(2);
    
    let fee = 0;
    if (!vehicle.isMonthly && !vehicle.isDaily) {
      fee = 5000 + (Math.ceil(durationHours) - 1) * 3000;
      if (fee < 5000) fee = 5000;
    }
    
    document.getElementById('returnCheckInTime').textContent = formatTime(checkInTime);
    document.getElementById('returnDuration').textContent = durationHours;
    document.getElementById('returnFee').textContent = 
      vehicle.isMonthly ? '(Vé tháng - 200.000 VND)' : 
      vehicle.isDaily ? '(Vé ngày - 5.000 VND)' : 
      `${fee.toLocaleString()} VND`;
    returnInfo.classList.remove('hidden');
    
    returnInfo.dataset.fee = fee;
    returnInfo.dataset.vehicleIndex = vehicleIndex;
  });

  // Trả xe - Xác nhận
  document.getElementById('confirmReturnBtn').addEventListener('click', function() {
    const returnInfo = document.getElementById('returnInfo');
    const vehicleIndex = returnInfo.dataset.vehicleIndex;
    const fee = parseFloat(returnInfo.dataset.fee);
    const licensePlate = document.getElementById('licenseReturn').value.trim();
    
    if (vehicleIndex === undefined) return;
    
    const vehicle = parkingData.vehicles[vehicleIndex];
    const checkOutTime = new Date();
    
    parkingData.parkingHistory.push({
      licensePlate,
      checkInTime: vehicle.checkInTime,
      checkOutTime,
      fee,
      isMonthly: vehicle.isMonthly,
      isDaily: vehicle.isDaily,
      status: 'Đã trả xe'
    });
    
    parkingData.vehicles.splice(vehicleIndex, 1);
    saveData();
    
    alert(`Đã trả xe thành công!\nBiển số: ${licensePlate}\nTổng phí: ${
      vehicle.isMonthly ? '(Vé tháng - 200.000 VND)' : 
      vehicle.isDaily ? '(Vé ngày - 5.000 VND)' : 
      fee.toLocaleString() + ' VND'
    }`);
    
    document.getElementById('licenseReturn').value = '';
    returnInfo.classList.add('hidden');
    updateReport();
  });

  // Kiểm tra xe trong bãi
  document.getElementById('checkVehicleBtn').addEventListener('click', function() {
    const licensePlate = document.getElementById('licenseCheck').value.trim();
    const checkResult = document.getElementById('checkResult');
    
    if (licensePlate) {
      const vehicle = parkingData.vehicles.find(v => v.licensePlate === licensePlate);
      const isMonthly = parkingData.monthlyTickets.includes(licensePlate);
      const today = new Date().toISOString().split('T')[0];
      const isDaily = parkingData.dailyTickets.some(
        t => t.licensePlate === licensePlate && t.date === today
      );
      
      if (vehicle) {
        const checkInTime = new Date(vehicle.checkInTime);
        const durationHours = ((new Date() - checkInTime) / (1000 * 60 * 60)).toFixed(2);
        
        checkResult.innerHTML = `
          <p><strong>Biển số:</strong> ${licensePlate}</p>
          <p><strong>Giờ vào:</strong> ${formatTime(checkInTime)}</p>
          <p><strong>Thời gian gửi:</strong> ${durationHours} giờ</p>
          <p><strong>Loại vé:</strong> ${
            isMonthly ? 'Vé tháng (200.000 VND)' : 
            isDaily ? 'Vé ngày (5.000 VND)' : 'Vé thường'
          }</p>
          <p style="color: #27ae60;">Xe đang có trong bãi</p>
        `;
      } else {
        checkResult.innerHTML = `
          <p><strong>Biển số:</strong> ${licensePlate}</p>
          <p style="color: #e74c3c;">Không tìm thấy xe này trong bãi</p>
          ${
            isMonthly ? '<p><strong>Lưu ý:</strong> Xe này có đăng ký vé tháng (200.000 VND)</p>' : 
            isDaily ? '<p><strong>Lưu ý:</strong> Xe này có đăng ký vé ngày (5.000 VND) hôm nay</p>' : ''
          }
        `;
      }
    } else {
      if (parkingData.vehicles.length === 0) {
        checkResult.innerHTML = '<p>Hiện không có xe nào trong bãi</p>';
      } else {
        let html = `<p><strong>Tổng số xe trong bãi:</strong> ${parkingData.vehicles.length}</p>`;
        html += '<ul style="margin-top: 10px;">';
        
        parkingData.vehicles.forEach(vehicle => {
          const checkInTime = new Date(vehicle.checkInTime);
          const durationHours = ((new Date() - checkInTime) / (1000 * 60 * 60)).toFixed(2);
          const isMonthly = parkingData.monthlyTickets.includes(vehicle.licensePlate);
          const today = new Date().toISOString().split('T')[0];
          const isDaily = parkingData.dailyTickets.some(
            t => t.licensePlate === vehicle.licensePlate && t.date === today
          );
          
          html += `
            <li style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
              <strong>${vehicle.licensePlate}</strong><br>
              Giờ vào: ${formatTime(checkInTime)}<br>
              Thời gian gửi: ${durationHours} giờ<br>
              Loại vé: ${
                isMonthly ? 'Vé tháng (200.000 VND)' : 
                isDaily ? 'Vé ngày (5.000 VND)' : 'Vé thường'
              }
            </li>
          `;
        });
        
        html += '</ul>';
        checkResult.innerHTML = html;
      }
    }
  });

  // Cập nhật báo cáo
  function updateReport() {
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = '';
    
    // Thêm hàng tiêu đề với checkbox chọn tất cả
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
      <th><input type="checkbox" id="selectAll" class="round-checkbox"></th>
      <th>Biển số</th>
      <th>Giờ vào</th>
      <th>Giờ ra</th>
      <th>Phí (VNĐ)</th>
      <th>Trạng thái</th>
    `;
    tbody.appendChild(headerRow);
    
    const sortedHistory = [...parkingData.parkingHistory].sort((a, b) => 
      new Date(b.checkOutTime) - new Date(a.checkOutTime));
    
    sortedHistory.forEach((record, index) => {
      const row = document.createElement('tr');
      
      let statusDisplay;
      if (record.status === 'Đã trả xe') {
        statusDisplay = '<span class="returned-badge">Đã trả xe</span>';
      } else if (record.isMonthly) {
        statusDisplay = '<span class="monthly-badge">Vé tháng</span>';
      } else if (record.isDaily) {
        statusDisplay = '<span class="daily-badge">Vé ngày</span>';
      } else {
        statusDisplay = '<span class="normal-badge">Thường</span>';
      }
      
      row.innerHTML = `
        <td><input type="checkbox" class="record-checkbox round-checkbox" data-index="${index}"></td>
        <td>${record.licensePlate}</td>
        <td>${formatTime(record.checkInTime)}</td>
        <td>${formatTime(record.checkOutTime)}</td>
        <td>${record.isMonthly ? '200.000' : record.isDaily ? '5.000' : record.fee.toLocaleString()}</td>
        <td>${statusDisplay}</td>
      `;
      
      tbody.appendChild(row);
    });

    // Thêm hàng chức năng nếu có dữ liệu
    if (parkingData.parkingHistory.length > 0) {
      const actionRow = document.createElement('tr');
      actionRow.innerHTML = `
        <td colspan="6" style="text-align: center;">
          <button class="delete-selected-btn" style="background-color: #e74c3c; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
            Xóa mục đã chọn
          </button>
          <button class="delete-all-btn" style="background-color: #e74c3c; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
            Xóa tất cả báo cáo
          </button>
        </td>
      `;
      tbody.appendChild(actionRow);

      // Xử lý sự kiện chọn tất cả
      document.getElementById('selectAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.record-checkbox');
        checkboxes.forEach(checkbox => {
          checkbox.checked = this.checked;
        });
      });

      // Xử lý sự kiện xóa mục đã chọn
      document.querySelector('.delete-selected-btn').addEventListener('click', function() {
        const selectedIndexes = [];
        document.querySelectorAll('.record-checkbox:checked').forEach(checkbox => {
          selectedIndexes.push(parseInt(checkbox.getAttribute('data-index')));
        });

        if (selectedIndexes.length === 0) {
          alert('Vui lòng chọn ít nhất một mục để xóa!');
          return;
        }

        if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIndexes.length} mục đã chọn?`)) {
          // Xóa theo thứ tự giảm dần để không ảnh hưởng đến index
          selectedIndexes.sort((a, b) => b - a).forEach(index => {
            parkingData.parkingHistory.splice(index, 1);
          });
          saveData();
          updateReport();
          alert(`Đã xóa ${selectedIndexes.length} mục báo cáo!`);
        }
      });

      // Xử lý sự kiện xóa tất cả
      document.querySelector('.delete-all-btn').addEventListener('click', function() {
        if (confirm('Bạn có chắc chắn muốn xóa tất cả báo cáo?')) {
          parkingData.parkingHistory = [];
          saveData();
          updateReport();
          alert('Đã xóa tất cả báo cáo!');
        }
      });
    }
  }

  // Lưu dữ liệu
  function saveData() {
    localStorage.setItem('parkingData', JSON.stringify(parkingData));
  }

  // Định dạng thời gian
  function formatTime(date) {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  // Định dạng ngày (YYYY-MM-DD -> DD/MM/YYYY)
  function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  // Khởi tạo báo cáo
  updateReport();
});