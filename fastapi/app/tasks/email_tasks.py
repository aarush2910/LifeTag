from fastapi import BackgroundTasks
from app.services.mailer import send_email
import html


#Email generated for farmer registration through lifetag

def schedule_welcome_farmer_email(background_tasks: BackgroundTasks, new_user):
    """
    Schedule farmer welcome email in background.
    Keeps route clean and readable.
    """
    html_content = f"""
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center;">
                <img src="cid:life_logo" alt="LifeTag Logo" width="60" />
                <h2 style="color: #2c7be5;">Welcome to LifeTag</h2>
                <p style="color: #444;">Empowering Farmers • Ensuring Livestock Welfare</p>
            </div>
            <hr style="margin: 20px 0;">
            <p>Dear <b>{new_user.fname}</b>,</p>
            <p>We are delighted to inform you that your <b>LifeTag Farmer Account</b> has been successfully created.</p>

            <ul>
              <li>Access your cattle details and vaccination records.</li>
              <li>Update ownership and health history.</li>
              <li>Connect with veterinary officers and shelters.</li>
              <li>Receive alerts about welfare schemes.</li>
            </ul>

            <p>Login anytime: <a href="https://lifetag.in/login">lifetag.in/login</a></p>

            <p>Need help? <a href="mailto:support@lifetag.in">support@lifetag.in</a></p>

            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #888; text-align: center;">
              This is an auto-generated email. Please do not reply.<br>
              © 2025 LifeTag. All Rights Reserved.
            </p>
        </div>
      </body>
    </html>
    """

    # Schedule in background
    background_tasks.add_task(
        send_email,
        "Welcome to LifeTag – Your Farmer Registration is Successful",
        new_user.femail,
        html_content,
        True
    )


def schedule_welcome_vet_email(background_tasks: BackgroundTasks, new_user):
  """
  Schedule welcome email for newly registered vets.
  """
  vet_html = f"""
  <!DOCTYPE html>
  <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
         <div style="text-align: center;">
            <img src="cid:life_logo" alt="LifeTag Logo" width="60" />
            <h2 style="color: #2c7be5;">Welcome to LifeTag</h2>
            <p style="color: #444;">Veterinarian Account Created</p>
         </div>
         <hr style="margin: 20px 0;">
        <p>Dear Dr. <b>{new_user.vname}</b>,</p>
        <p>Your veterinarian account has been successfully created. You can now access vet tools, receive alerts, and connect with farmers in your region.</p>
        <p style="margin-top: 30px;">Warm regards,<br><b>The LifeTag Support Team</b></p>
      </div>
    </body>
  </html>
    """

  background_tasks.add_task(
    send_email,
    "Welcome to LifeTag - Veterinarian Account",
    new_user.vemail,
    vet_html,
    True,
  )


def schedule_welcome_shelter_email(background_tasks: BackgroundTasks, new_user):
  """
  Schedule welcome email for newly registered shelters.
  """
  shelter_html = f"""
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center;">
          <img src="cid:life_logo" alt="LifeTag Logo" width="60" />
          <h2 style="color: #2c7be5;">Welcome to LifeTag</h2>
          <p style="color: #444;">Shelter Account Created</p>
        </div>
        <hr style="margin: 20px 0;">
        <p>Dear <b>{new_user.sname}</b>,</p>
        <p>Your shelter account has been successfully created. You can now manage shelter listings, coordinate rescues, and receive alerts from LifeTag.</p>
        <p style="margin-top: 30px;">Warm regards,<br><b>The LifeTag Support Team</b></p>
      </div>
    </body>
  </html>
  """

  background_tasks.add_task(
    send_email,
    "Welcome to LifeTag - Shelter Account",
    new_user.semail,
    shelter_html,
    True,
  )


# Email 

def schedule_cattle_complaint_email(background_tasks: BackgroundTasks, complaint):
  """
  Schedule an email to the reporter when a cattle complaint is registered.
  The complaint object is expected to have reporter_email, reporter_name and complaint_id attributes.
  """
  try:
    if not complaint.reporter_email:
      return


    safe_name = html.escape(complaint.reporter_name or "Reporter")
    safe_complaint_id = html.escape(str(complaint.complaint_id))

    html_content = f"""
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center;">
        <!-- embedded CID image served as inline attachment by the mailer -->
        <img src="cid:life_logo" alt="LifeTag Logo" width="60" />
        <h2 style="color: #2c7be5;">Complaint Registered Successfully</h2>
        <p style="color: #444;">LifeTag – Livestock Welfare & Monitoring System</p>
      </div>
      <hr style="margin: 20px 0;">

      <p>Dear <b>{safe_name}</b>,</p>

      <p>Thank you for reaching out to <b>LifeTag</b>. Your cattle-related complaint has been successfully registered in our system.</p>

      <p><b>Complaint Details:</b></p>
      <ul>
        <li><b>Complaint ID:</b> {safe_complaint_id}</li>
        <li><b>Status:</b> Open (Under Review)</li>
        <li><b>Category:</b> Livestock Complaint / Abandoned Animal Report</li>
      </ul>

      <p>Our verification team has been notified and will initiate the necessary actions in coordination with nearby shelters and authorities. You can track the progress of your complaint by logging into your LifeTag account or visiting the complaint tracking portal.</p>

      <p style="margin-top: 20px;">Track your complaint at:<br>
        <a href="https://lifetag.in/complaint-status/{safe_complaint_id}" 
        style="color: #2c7be5; text-decoration: none;">https://lifetag.in/complaint-status/{safe_complaint_id}</a>
      </p>

      <p>If any additional information is required, our team will contact you at your registered email or phone number.</p>

      <p style="margin-top: 30px;">Thank you for contributing to animal welfare.<br>
      <b>Team LifeTag</b><br>
      Department of Digital Livestock Management<br>
      Ministry of Animal Husbandry & Dairying (Prototype)</p>

      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">
        This is an auto-generated email. Please do not reply.<br>
        © 2025 LifeTag. All Rights Reserved.
      </p>
    </div>
  </body>
</html>
"""

    # Schedule in background
    background_tasks.add_task(
      send_email,
      "LifeTag – Cattle Complaint Registered Successfully",
      complaint.reporter_email,
      html_content,
      True,
    )
  except Exception:
    import logging

    logging.exception("Failed to schedule complaint notification email")


async def send_cattle_complaint_email(complaint):
  """
  Async function to send the complaint notification email immediately.
  This is useful when callers want to schedule via asyncio.create_task.
  """
  try:
    if not complaint.reporter_email:
      return

    safe_name = html.escape(complaint.reporter_name or "Reporter")
    safe_complaint_id = html.escape(str(complaint.complaint_id))

    html_content = f"""
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center;">
        <!-- embedded CID image served as inline attachment by the mailer -->
        <img src="cid:life_logo" alt="LifeTag Logo" width="60" />
        <h2 style="color: #2c7be5;">Complaint Registered Successfully</h2>
        <p style="color: #444;">LifeTag – Livestock Welfare & Monitoring System</p>
      </div>
      <hr style="margin: 20px 0;">

      <p>Dear <b>{safe_name}</b>,</p>

      <p>Thank you for reaching out to <b>LifeTag</b>. Your cattle-related complaint has been successfully registered in our system.</p>

      <p><b>Complaint Details:</b></p>
      <ul>
        <li><b>Complaint ID:</b> {safe_complaint_id}</li>
        <li><b>Status:</b> Open (Under Review)</li>
        <li><b>Category:</b> Livestock Complaint / Abandoned Animal Report</li>
      </ul>

      <p>Our verification team has been notified and will initiate the necessary actions in coordination with nearby shelters and authorities. You can track the progress of your complaint by logging into your LifeTag account or visiting the complaint tracking portal.</p>

      <p style="margin-top: 20px;">Track your complaint at:<br>
        <a href="https://lifetag.in/complaint-status/{safe_complaint_id}" 
        style="color: #2c7be5; text-decoration: none;">https://lifetag.in/complaint-status/{safe_complaint_id}</a>
      </p>

      <p>If any additional information is required, our team will contact you at your registered email or phone number.</p>

      <p style="margin-top: 30px;">Thank you for contributing to animal welfare.<br>
      <b>Team LifeTag</b><br>
      Department of Digital Livestock Management<br>
      Ministry of Animal Husbandry & Dairying (Prototype)</p>

      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">
        This is an auto-generated email. Please do not reply.<br>
        © 2025 LifeTag. All Rights Reserved.
      </p>
    </div>
  </body>
</html>
"""

    await send_email(
      "LifeTag – Cattle Complaint Registered Successfully",
      complaint.reporter_email,
      html_content,
      True,
    )
  except Exception:
    import logging

    logging.exception("Failed to send complaint notification email")
