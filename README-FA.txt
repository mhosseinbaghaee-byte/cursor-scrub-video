CursorScrubVideo — راهنمای سریع فریمر
=====================================

فایل‌ها:
1) CursorScrubVideo.tsx  → کد کامپوننت فریمر
2) character-scrub.mp4   → ویدیوی کاراکتر (هر فریم keyframe — برای اسکرول نرم)

نصب در Framer:
1. Assets → Code → New Code File
2. محتوای CursorScrubVideo.tsx را جایگزین کن و ذخیره کن
3. کامپوننت را روی صفحه بکش
4. ویدیوی character-scrub.mp4 را آپلود کن و به prop به نام Video وصل کن
5. موس را حرکت بده: کاراکتر به چپ/راست/بالا/پایین نگاه می‌کند

تنظیمات پیشنهادی:
- Axis: Horizontal
- Tracking: Component
- Smoothing: 0.22
- Reverse: Off
- Fit: Cover

نکته: ویدیو پخش خودکار ندارد؛ فقط با موقعیت موس اسکرول می‌شود.
