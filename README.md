# فورم التقديم — Super كريتيف

صفحة تقديم واحدة (Vite + React) بنفس هوية المسابقة، والبيانات بتتحفظ في **Firebase Firestore**، والموقع بيترفع على **Vercel**.

## 1) إعداد Firebase (مرة واحدة)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Build → Firestore Database → Create database** (اختار Production mode وأقرب منطقة).
3. **Project settings (⚙) → General → Your apps → `</>` Web** → سجّل تطبيق ويب وانسخ قيم الـ config.
4. **Firestore → Rules** → امسح الموجود والصق محتوى ملف [`firestore.rules`](./firestore.rules) → **Publish**.
   (القواعد بتسمح بإضافة طلب فقط بعد التحقق من البيانات، ومفيش حد يقدر يقرا أو يعدّل أو يمسح من برّه.)

## 2) تشغيل محلي

```bash
npm install
cp .env.example .env     # وحط قيم Firebase جواه
npm run dev
```

## 3) الرفع على Vercel

### الطريقة الأسهل (من GitHub)
1. ارفع المشروع على GitHub.
2. [vercel.com/new](https://vercel.com/new) → **Import** الريبو. الإعدادات بتتعرف لوحدها (Vite).
3. في **Environment Variables** ضيف المتغيرات الستة من `.env.example` (`VITE_FIREBASE_*`).
4. **Deploy**. أي تعديل بعد كده بتعمل له `git push` وبيترفع لوحده.

### أو بالـ CLI
```bash
npx vercel          # أول مرة: بيسألك تسجّل دخول وتربط المشروع
npx vercel --prod
```
(ضيف متغيرات البيئة من لوحة Vercel → Settings → Environment Variables قبل `--prod`.)

## ملاحظات
- مفاتيح `VITE_FIREBASE_*` بتبقى ظاهرة في المتصفح **بالتصميم** (دي مش أسرار). الحماية الفعلية هي `firestore.rules`.
- الطلبات بتتشاف في **Firebase Console → Firestore → registrations**.
- حماية من السبام: حقل مخفي (honeypot) + حد أقصى 3 طلبات كل 10 دقايق من نفس المتصفح + تحقق في القواعد.
- صورة المعاينة على واتساب: `public/og.png`. العنوان بيتحدد تلقائيًا على Vercel، أو ضيف `VITE_SITE_URL` لو عندك دومين خاص.
