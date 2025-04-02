import autocannon from "autocannon";
import { faker } from "@faker-js/faker";

// إنشاء مجموعة من الطلبات مع بيانات ديناميكية
const requests = Array.from({ length: 1000 }, () => {
  const payload = {
    email: faker.internet.email(),
    password: "Password!@12",
    username: faker.person.fullName(),
    deviceToken: "412b180d0faccb36647d8c",
    deviceAuthKey:
      "078d643b32e251a6c7c2bd15955de5bc4c09f6482fb812031ecc07e9b88784c6",
  };
  return { body: JSON.stringify(payload) };
});

async function runTest() {
  // مصفوفة لتجميع تفاصيل الأخطاء
  const errorResponses = [];

  try {
    const instance = autocannon({
      url: "http://localhost:5000/api/v1/users",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      requests, // استخدام الطلبات المولدة مسبقاً
      connections: 10,
      duration: 10,
    });

    // التقاط ردود الأخطاء
    instance.on("response", (client, statusCode, resBytes, responseTime) => {
      if (statusCode >= 400) {
        let responseBody;
        let errorMessage = "Unknown error";

        try {
          responseBody = JSON.parse(resBytes.toString());
          // استخراج السبب الفعلي للخطأ إذا كان موجودًا في الاستجابة
          errorMessage =
            responseBody.message ||
            responseBody.error ||
            JSON.stringify(responseBody);
        } catch (error) {
          responseBody = resBytes.toString();
          errorMessage = responseBody;
        }

        // تجميع تفاصيل الخطأ
        errorResponses.push({
          statusCode,
          errorMessage,
          responseTime,
        });

        console.error(
          `Error response: Status ${statusCode}, Message: ${errorMessage}, ResponseTime: ${responseTime}ms`
        );
      }
    });

    // التقاط أخطاء الطلبات (مثل فشل الاتصال)
    instance.on("reqError", (error) => {
      console.error("Request error:", error);
    });

    instance.on("done", () => {
      console.log("Test finished");
      // عرض تفاصيل الأخطاء بعد انتهاء الاختبار
      if (errorResponses.length > 0) {
        console.log("Collected error responses:", errorResponses);
      } else {
        console.log("No error responses collected.");
      }
    });
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

runTest();
