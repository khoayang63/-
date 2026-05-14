"use client";
import { useState, useEffect } from "react";

// Tọa độ kho hàng mặc định (Quận 10, TP.HCM)
const SHOP_LAT = 10.772596;
const SHOP_LNG = 106.671337;

export default function CheckoutForm({ form, setForm, setShippingData }) {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calcError, setCalcError] = useState("");

    useEffect(() => {
        fetch("https://provinces.open-api.vn/api/?depth=1")
            .then(res => res.json())
            .then(data => setProvinces(data));
    }, []);

    const handleProvinceChange = (e) => {
        const provinceCode = e.target.value;
        const selected = provinces.find(p => p.code == provinceCode);
        setForm({ ...form, province: selected, district: null, ward: null });
        setDistricts([]);
        setWards([]);
        if (provinceCode) {
            fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
                .then(res => res.json())
                .then(data => setDistricts(data.districts || []));
        }
    };

    const handleDistrictChange = (e) => {
        const districtCode = e.target.value;
        const selected = districts.find(d => d.code == districtCode);
        setForm({ ...form, district: selected, ward: null });
        setWards([]);
        if (districtCode) {
            fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
                .then(res => res.json())
                .then(data => setWards(data.wards || []));
        }
    };

    const handleWardChange = (e) => {
        const wardCode = e.target.value;
        const selected = wards.find(w => w.code == wardCode);
        setForm({ ...form, ward: selected });
    };

    const calculateShipping = async () => {
        if (!form.province || !form.district || !form.ward || !form.street) {
            setCalcError("Vui lòng nhập đầy đủ Tỉnh, Huyện, Xã và Số nhà/Đường");
            return;
        }

        setIsCalculating(true);
        setCalcError("");
        try {
            // 1. Tìm kiếm chuỗi đầy đủ và chính xác nhất
            const exactAddress = `${form.street}, ${form.ward.name}, ${form.district.name}, ${form.province.name}`;
            let nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&q=${encodeURIComponent(exactAddress)}`);
            let nomData = await nomRes.json();

            let targetLat, targetLng;

            if (nomData && nomData.length > 0) {
                targetLat = nomData[0].lat;
                targetLng = nomData[0].lon;
            } else {
                // 2. Fallback 1: Tìm Tên địa danh/Số nhà + Tỉnh thành (Bỏ qua Quận/Phường vì bản đồ OSM thường có ranh giới hành chính không khớp thực tế)
                const landmarkAddress = `${form.street}, ${form.province.name}`;
                nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&q=${encodeURIComponent(landmarkAddress)}`);
                nomData = await nomRes.json();

                if (nomData && nomData.length > 0) {
                    targetLat = nomData[0].lat;
                    targetLng = nomData[0].lon;
                } else {
                    // 3. Fallback 2: Chỉ tìm theo Phường/Xã + Quận/Huyện + Tỉnh (Chấp nhận tính ship tới trung tâm Phường)
                    const shortAddress = `${form.ward.name}, ${form.district.name}, ${form.province.name}`;
                    nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&q=${encodeURIComponent(shortAddress)}`);
                    nomData = await nomRes.json();
                    
                    if (nomData && nomData.length > 0) {
                        targetLat = nomData[0].lat;
                        targetLng = nomData[0].lon;
                        setCalcError("Không tìm thấy chính xác số nhà, sẽ tính phí ship dựa trên khu vực Phường/Xã.");
                    } else {
                        // Mặc định nếu không tìm thấy gì cả
                        setShippingData({ fee: 50000, distanceKm: 999, lat: SHOP_LAT, lng: SHOP_LNG });
                        setCalcError("Không thể định vị địa chỉ này. Mặc định phí ship: 50.000đ");
                        setIsCalculating(false);
                        return;
                    }
                }
            }

            // OSRM
            const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${SHOP_LNG},${SHOP_LAT};${targetLng},${targetLat}?overview=false`);
            const osrmData = await osrmRes.json();

            let distanceKm = 999;
            if (osrmData.routes && osrmData.routes.length > 0) {
                distanceKm = osrmData.routes[0].distance / 1000;
            }

            let fee = 0;
            if (distanceKm <= 5) fee = 15000;
            else if (distanceKm <= 10) fee = 30000;
            else fee = 50000;

            setShippingData({ fee, distanceKm, lat: targetLat, lng: targetLng });
        } catch (error) {
            console.error(error);
            setShippingData({ fee: 50000, distanceKm: 999, lat: SHOP_LAT, lng: SHOP_LNG });
            setCalcError("Lỗi kết nối hệ thống bản đồ. Mặc định phí ship: 50.000đ");
        } finally {
            setIsCalculating(false);
        }
    };

    return (
        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="text-amber-500">📍</span> Thông tin giao hàng
            </h2>

            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Họ và tên</label>
                        <input
                            placeholder="Nhập họ và tên..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Số điện thoại</label>
                        <input
                            placeholder="Nhập số điện thoại..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Tỉnh/Thành phố</label>
                        <select
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all"
                            value={form.province?.code || ""}
                            onChange={handleProvinceChange}
                        >
                            <option value="">-- Chọn Tỉnh/Thành phố --</option>
                            {provinces.map((p) => (
                                <option key={p.code} value={p.code}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Quận/Huyện</label>
                        <select
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all disabled:opacity-50"
                            value={form.district?.code || ""}
                            onChange={handleDistrictChange}
                            disabled={!form.province}
                        >
                            <option value="">-- Chọn Quận/Huyện --</option>
                            {districts.map((d) => (
                                <option key={d.code} value={d.code}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Phường/Xã</label>
                        <select
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all disabled:opacity-50"
                            value={form.ward?.code || ""}
                            onChange={handleWardChange}
                            disabled={!form.district}
                        >
                            <option value="">-- Chọn Phường/Xã --</option>
                            {wards.map((w) => (
                                <option key={w.code} value={w.code}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Số nhà, Tên đường</label>
                    <div className="flex gap-3">
                        <input
                            placeholder="Ví dụ: 123 Đường Lê Lợi..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                            value={form.street}
                            onChange={(e) => setForm({ ...form, street: e.target.value })}
                        />
                        <button 
                            onClick={calculateShipping}
                            disabled={isCalculating}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-6 rounded-xl font-bold transition-all shadow-md whitespace-nowrap"
                        >
                            {isCalculating ? "Đang tính..." : "Tính Phí Ship"}
                        </button>
                    </div>
                    {calcError && <p className="text-amber-500 text-sm mt-2">{calcError}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Ghi chú (Tùy chọn)</label>
                    <textarea
                        placeholder="Ghi chú thêm về đơn hàng..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all min-h-[100px]"
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
}